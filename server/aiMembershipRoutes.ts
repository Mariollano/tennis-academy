import express, { type Express, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { aiGuideAssets } from "../drizzle/schema";
import { AI_GUIDES } from "../shared/aiMembership";
import { membershipDb, decryptGuide } from "./aiMembershipSecurity";
import { requireActiveMember } from "./routers/aiMembershipAccount";
import { storageGet } from "./storage";
import { membershipEmailHtml } from "./aiMembershipEmail";
import { membershipWebhookSettings, storedMembershipWebhookSecret, membershipStripe } from "./aiMembershipReadiness";
import { handleMembershipStripeEvent } from "./aiMembershipFulfillment";

export function registerMembershipWebhook(app: Express) {
  app.post("/api/ai-members/stripe-webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    try {
      const settings = await membershipWebhookSettings();
      if (!settings) return res.status(503).send("Membership webhook is not connected");
      const stripe = membershipStripe();
      let event;
      try { event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"] as string, storedMembershipWebhookSecret(settings)); }
      catch { return res.status(400).send("Invalid membership webhook signature"); }
      if (!event.livemode || event.id.startsWith("evt_test_")) return res.json({ ignored: true });
      await handleMembershipStripeEvent(event);
      return res.json({ received: true });
    } catch {
      console.warn("[AIMembership] Dedicated webhook needs retry.");
      return res.status(500).send("Membership webhook needs retry");
    }
  });
}
export async function downloadMemberGuide(req: Request, res: Response) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  try {
    await requireActiveMember(req);
    const slot = req.params.slot;
    if (!AI_GUIDES.some(guide => guide.slot === slot)) return res.status(404).send("Guide not found.");
    const db = await membershipDb();
    const [asset] = await db.select().from(aiGuideAssets).where(eq(aiGuideAssets.slot, slot)).limit(1);
    if (!asset) return res.status(404).send("Coming soon — Coach Mario has not uploaded this PDF yet.");
    const { url } = await storageGet(asset.encryptedStorageKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Encrypted guide could not be retrieved");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 11 * 1024 * 1024) throw new Error("Guide is too large");
    const pdf = decryptGuide(bytes);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${asset.filename.replace(/[^a-zA-Z0-9._ -]/g, "_")}"`);
    return res.send(pdf);
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED") return res.status(401).send("Sign in at /ai-members to download this guide.");
    if (error.code === "FORBIDDEN") return res.status(403).send("An active paid membership is required.");
    console.warn("[AIMembership] Protected guide download unavailable.");
    return res.status(503).send("Guide download is temporarily unavailable. Please contact Coach Mario.");
  }
}
export function registerMembershipRoutes(app: Express) {
  app.get("/api/ai-members/download/:slot", downloadMemberGuide);
  app.get("/api/ai-members/welcome-preview", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
    res.send(membershipEmailHtml("https://tennispromario.com", "https://tennispromario.com/ai-members/sign-in"));
  });
}
