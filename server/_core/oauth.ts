import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ensureReferralCode } from "../referral";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// The custom domain where users should always end up after login
const CUSTOM_DOMAIN = "https://tennispromario.com";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Route to receive session token from cross-domain OAuth redirect and set cookie
  app.get("/api/oauth/set-session", (req: Request, res: Response) => {
    const token = getQueryParam(req, "token");
    const returnPath = getQueryParam(req, "returnPath");

    if (!token) {
      return res.redirect(302, "/?login_error=missing_token");
    }

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    const redirectPath = returnPath && returnPath.startsWith("/") ? returnPath : "/";
    console.log(`[OAuth] Cross-domain session set, redirecting to: ${redirectPath}`);
    res.redirect(302, redirectPath);
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[OAuth] Callback missing code or state. code:", !!code, "state:", !!state, "query:", req.query);
      // Redirect to custom domain home with error message
      return res.redirect(302, `${CUSTOM_DOMAIN}/?login_error=missing_code`);
    }

    try {
      // Exchange code for token — SDK decodes state as btoa(redirectUri)
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // returnPath comes from ?returnPath= query param embedded in the redirectUri
      const refCode = getQueryParam(req, "ref");
      const returnPath = getQueryParam(req, "returnPath");

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
            if (refCode && refCode.length > 3 && !newUser.referredBy) {
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

      // Determine the current request host to decide whether we need a cross-domain redirect.
      // The callback may fire on manus.space (our canonical OAuth redirect URI) or on tennispromario.com.
      // We check multiple headers since the Manus proxy may forward the original host differently.
      const requestHost =
        (req.headers["x-forwarded-host"] as string) ||
        (req.headers["x-original-host"] as string) ||
        req.headers.host ||
        "";

      const isCustomDomain =
        requestHost.includes("tennispromario.com") ||
        requestHost.includes("tennispromario");

      const redirectPath = returnPath && returnPath.startsWith("/") ? returnPath : "/";

      if (isCustomDomain) {
        // Already on the custom domain — set cookie directly and redirect
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        console.log(`[OAuth] Login success (custom domain) for openId: ${userInfo.openId}, redirecting to: ${redirectPath}`);
        return res.redirect(302, redirectPath);
      }

      // Callback fired on manus.space — redirect to custom domain's set-session endpoint
      // to set the cookie on the correct domain (tennispromario.com).
      const setSessionUrl = new URL(`${CUSTOM_DOMAIN}/api/oauth/set-session`);
      setSessionUrl.searchParams.set("token", sessionToken);
      if (redirectPath !== "/") {
        setSessionUrl.searchParams.set("returnPath", redirectPath);
      }
      console.log(`[OAuth] Login success (manus.space) for openId: ${userInfo.openId}, cross-domain redirect to custom domain`);
      return res.redirect(302, setSessionUrl.toString());
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Redirect to custom domain home with error param
      return res.redirect(302, `${CUSTOM_DOMAIN}/?login_error=oauth_failed`);
    }
  });
}
