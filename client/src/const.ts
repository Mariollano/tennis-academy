export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The canonical manus.space URL is always registered as an allowed OAuth redirect URI.
// Custom domains (tennispromario.com) may not be registered yet, so we always use the
// manus.space URL for the OAuth redirect. After login, the server redirects to tennispromario.com.
const CANONICAL_OAUTH_ORIGIN = "https://tennispro-kzzfscru.manus.space";

// Generate login URL at runtime so redirect URI reflects the canonical origin.
// IMPORTANT: state must be btoa(redirectUri) — the OAuth SDK decodes it with atob()
// and passes the result directly as redirectUri. Do NOT change the state format.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Always use the manus.space origin for the OAuth redirect URI — it's guaranteed to be registered.
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
