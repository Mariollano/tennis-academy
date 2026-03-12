export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The manus.space URL is the only registered OAuth redirect URI AND the only
// domain where /api/* routes are correctly proxied to the Express server.
// Custom domain (www.tennispromario.com) has /api/* intercepted by the CDN.
//
// FIX #9: After the handshake completes on manus.space, the server redirects
// to www.tennispromario.com/oauth/set-session (outside /api/) which Express
// handles directly without CDN interception.
const CANONICAL_OAUTH_ORIGIN = "https://tennispro-kzzfscru.manus.space";

export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Always use the registered manus.space callback URL.
  const callbackUrl = new URL(`${CANONICAL_OAUTH_ORIGIN}/api/oauth/callback`);

  // Pass returnPath so the server redirects the user back to the right page.
  if (returnPath && returnPath.startsWith("/")) {
    callbackUrl.searchParams.set("returnPath", returnPath);
  }

  const redirectUri = callbackUrl.toString();
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
