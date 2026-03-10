import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ensureReferralCode } from "../referral";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Extract referral code from state if present
      // State can be: plain base64(redirectUri) OR base64(JSON{redirectUri,ref,returnPath})
      let refCode: string | undefined;
      let returnPath: string | undefined;
      try {
        // Try standard base64 first (btoa from browser), then base64url
        let decoded: string;
        try {
          decoded = Buffer.from(state, "base64").toString("utf-8");
        } catch {
          decoded = Buffer.from(state, "base64url").toString("utf-8");
        }
        if (decoded.startsWith("{")) {
          const stateObj = JSON.parse(decoded);
          if (stateObj?.ref && typeof stateObj.ref === "string" && stateObj.ref.length > 3) {
            refCode = stateObj.ref;
          }
          if (stateObj?.returnPath && typeof stateObj.returnPath === "string") {
            returnPath = stateObj.returnPath;
          }
        }
      } catch { /* ignore parse errors */ }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Ensure the user has a personal referral code; also store referredBy on first signup
      try {
        const dbConn = await getDb();
        if (dbConn) {
          const [newUser] = await dbConn
            .select({ id: users.id, referredBy: users.referredBy })
            .from(users)
            .where(eq(users.openId, userInfo.openId))
            .limit(1);

          if (newUser) {
            // Generate their own referral code if they don't have one yet
            await ensureReferralCode(newUser.id, userInfo.name || null);
            // Store referredBy only on first signup (not on subsequent logins)
            if (refCode && !newUser.referredBy) {
              await dbConn.update(users).set({ referredBy: refCode }).where(eq(users.id, newUser.id));
              console.log(`[Referral] User #${newUser.id} signed up via referral code: ${refCode}`);
            }
          }
        }
      } catch (refErr) {
        // Non-fatal — don't block login if referral code generation fails
        console.warn("[Referral] Failed to ensure referral code:", refErr);
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
       res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      // Redirect to returnPath if provided, otherwise home
      const redirectTo = returnPath && returnPath.startsWith("/") ? returnPath : "/";
      res.redirect(302, redirectTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
