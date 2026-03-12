export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The manus.space URL is the only registered OAuth redirect URI AND the only
// domain where /api/* routes are correctly proxied to the Express server.
// Custom domain (www.tennispromario.com) has /api/* intercepted by the CDN.
//
// Workaround: always use manus.space as the OAuth callback origin.
// After the handshake completes on manus.space, the server sets the session
// cookie and redirects the user back to www.tennispromario.com via
// /api/oauth/set-session on the manus.space domain.
const CANONICAL_OAUTH_ORIGIN = "https://tennispro-kzzfscru.manus.space";

// The custom domain where users should land after login.
// Passed as a query param so the manus.space callback can redirect there.
const CUSTOM_DOMAIN = "https://www.tennispromario.com";

export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Always use the registered manus.space callback URL.
  const callbackUrl = new URL(`${CANONICAL_OAUTH_ORIGIN}/api/oauth/callback`);

  // Embed the custom domain + returnPath so the server knows where to send
  // the user after the OAuth handshake completes.
  const finalReturnUrl = returnPath && returnPath.startsWith("/")
    ? `${CUSTOM_DOMAIN}${returnPath}`
    : CUSTOM_DOMAIN;
  callbackUrl.searchParams.set("customDomainReturn", finalReturnUrl);

  const redirectUri = callbackUrl.toString();
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
