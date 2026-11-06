import { createHash, randomBytes, createCipheriv, createDecipheriv, hkdfSync, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { parse } from "cookie";
import type { Request, Response } from "express";
import { and, eq, gt, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { aiMembers, aiMemberSessions, aiLoginTokens } from "../drizzle/schema";
import { isMembershipOrigin } from "../shared/aiMembership";

export const MEMBER_COOKIE = "ai_member_session";
export const CLAIM_COOKIE = "ai_checkout_claim";
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export function tokensMatch(token: string, storedHash: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(storedHash)) return false;
  return timingSafeEqual(Buffer.from(hashToken(token), "hex"), Buffer.from(storedHash, "hex"));
}
export async function membershipDb() {
  const db = await getDb();
  if (!db) throw new Error("Membership database is unavailable");
  return db;
}
export function readMemberCookie(req: Request, name = MEMBER_COOKIE) {
  return parse(req.headers.cookie || "")[name] || "";
}
function cookieSettings(req: Request, maxAge: number) {
  return { httpOnly: true, secure: req.secure || req.headers["x-forwarded-proto"] === "https", sameSite: "lax" as const, path: "/", maxAge };
}
export function setClaimCookie(req: Request, res: Response, token: string) {
  res.cookie(CLAIM_COOKIE, token, cookieSettings(req, 24 * 60 * 60 * 1000));
}
export async function createMemberSession(memberId: number, req: Request, res: Response) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const db = await membershipDb();
  await db.insert(aiMemberSessions).values({ hash: hashToken(token), memberId, expiresAt });
  res.cookie(MEMBER_COOKIE, token, cookieSettings(req, 30 * 24 * 60 * 60 * 1000));
}
export async function getSignedInMember(req: Request) {
  const token = readMemberCookie(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await membershipDb();
  const rows = await db.select({ member: aiMembers }).from(aiMemberSessions)
    .innerJoin(aiMembers, eq(aiMembers.id, aiMemberSessions.memberId))
    .where(and(eq(aiMemberSessions.hash, hashToken(token)), gt(aiMemberSessions.expiresAt, new Date()))).limit(1);
  return rows[0]?.member || null;
}
export async function createLoginToken(memberId: number) {
  const token = newToken();
  const db = await membershipDb();
  await db.insert(aiLoginTokens).values({ hash: hashToken(token), memberId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  return token;
}
export async function consumeLoginToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await membershipDb();
  return db.transaction(async tx => {
    const [row] = await tx.select().from(aiLoginTokens).where(eq(aiLoginTokens.hash, hashToken(token))).limit(1).for("update");
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) return null;
    await tx.update(aiLoginTokens).set({ usedAt: new Date() }).where(and(eq(aiLoginTokens.hash, row.hash), isNull(aiLoginTokens.usedAt)));
    return row.memberId;
  });
}
export function requireMembershipOrigin(origin: string) {
  if (!isMembershipOrigin(origin)) throw new TRPCError({ code: "BAD_REQUEST", message: "Please use the academy website to continue." });
}
export function requireSameSite(req: Request) {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !isMembershipOrigin(origin)) throw new TRPCError({ code: "FORBIDDEN", message: "Use the academy website to continue." });
  if (req.headers["sec-fetch-site"] === "cross-site") throw new TRPCError({ code: "FORBIDDEN", message: "Cross-site requests are not allowed." });
}

export function membershipClientAddress(req: Request) {
  const peer = (req.socket.remoteAddress || "unknown").replace(/^::ffff:/, "");
  // Trust loopback by default, not arbitrary public forwarding headers.
  // A different deployment proxy must be allowlisted by its exact peer IP.
  const trusted = (process.env.MEMBERSHIP_TRUSTED_PROXY_IPS || "127.0.0.1,::1").split(",").map(ip => ip.trim());
  if (!trusted.includes(peer)) return peer;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded !== "string") return peer;
  // Use the hop appended by the immediately trusted proxy, not a visitor's
  // spoofable leftmost value. Never change trust settings for tennis routes.
  const client = forwarded.split(",").pop()?.trim().replace(/^::ffff:/, "") || "";
  return isIP(client) ? client : peer;
}

// Hosted storage links can be public. Only encrypted bytes go into storage;
// plaintext is decrypted server-side AFTER member authorization, never redirected.
function encryptionKey() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) throw new Error("A persistent encryption secret is required");
  return Buffer.from(hkdfSync("sha256", process.env.JWT_SECRET, "ri-tennis-ai-library-v1", "pdf-encryption", 32));
}
export function encryptGuide(pdf: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(pdf), cipher.final()]);
  return Buffer.concat([Buffer.from("AIPDF1"), iv, cipher.getAuthTag(), ciphertext]);
}
export function decryptGuide(file: Buffer) {
  if (file.subarray(0, 6).toString() !== "AIPDF1" || file.length < 34) throw new Error("Invalid encrypted guide");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), file.subarray(6, 18));
  decipher.setAuthTag(file.subarray(18, 34));
  return Buffer.concat([decipher.update(file.subarray(34)), decipher.final()]);
}
export function validatePdf(base64: string, filename: string) {
  const pdf = Buffer.from(base64, "base64");
  if (!/\.pdf$/i.test(filename) || pdf.length > 10 * 1024 * 1024 || pdf.length < 8 || pdf.subarray(0, 5).toString() !== "%PDF-") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid PDF up to 10 MB." });
  }
  return pdf;
}

// Bounded in-memory abuse protection; no emailed token or credential is logged.
const limits = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, max = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  if (limits.size >= 5000) limits.forEach((value, k) => { if (value.until <= now) limits.delete(k); });
  if (limits.size >= 5000 && !limits.has(key)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please try again shortly." });
  const old = limits.get(key);
  const entry = old && old.until > now ? old : { count: 0, until: now + windowMs };
  entry.count++;
  limits.set(key, entry);
  if (entry.count > max) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });
}
