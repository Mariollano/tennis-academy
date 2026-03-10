export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// IMPORTANT: state must be btoa(redirectUri) — the OAuth SDK decodes it with atob()
// and passes the result directly as redirectUri. Do NOT change the state format.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
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
