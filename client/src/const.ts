export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The canonical manus.space URL is always registered as an allowed OAuth redirect URI.
// Custom domains (tennispromario.com) may not be registered yet, so we always use the
// manus.space URL for the OAuth redirect. After login, the server redirects to returnPath.
const CANONICAL_OAUTH_ORIGIN = "https://tennispro-kzzfscru.manus.space";

// Generate login URL at runtime so redirect URI reflects the canonical origin.
// IMPORTANT: state must be btoa(redirectUri) — the OAuth SDK decodes it with atob()
// and passes the result directly as redirectUri. Do NOT change the state format.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Always use the manus.space origin for the OAuth redirect URI — it's guaranteed to be registered.
  // After login succeeds, the server will redirect to returnPath (which defaults to "/").
  const redirectUri = `${CANONICAL_OAUTH_ORIGIN}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  // Pass returnPath as a query param on the redirect URI so the backend can redirect after login
  if (returnPath) {
    url.searchParams.set("returnPath", returnPath);
  }

  return url.toString();
};
