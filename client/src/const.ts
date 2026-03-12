export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Using the custom domain as the canonical OAuth origin so the callback
// fires directly on tennispromario.com instead of the old manus.space URL.
const CANONICAL_OAUTH_ORIGIN = "https://tennispromario.com";

// Generate login URL at runtime so redirect URI reflects the canonical origin.
// IMPORTANT: state must be btoa(redirectUri) — the OAuth SDK decodes it with atob()
// and passes the result directly as redirectUri. Do NOT change the state format.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Always use the custom domain for the OAuth redirect URI.
  // Embed returnPath as a query param in the redirectUri itself so the server receives it in the callback.
  const callbackUrl = new URL(`${CANONICAL_OAUTH_ORIGIN}/api/oauth/callback`);
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
