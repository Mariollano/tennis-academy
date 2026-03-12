export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime using the current window origin.
// This ensures the OAuth callback URL matches the registered manus.space URL
// (https://tennispro-kzzfscru.manus.space/api/oauth/callback) which is the
// only redirect URI registered in the Manus OAuth system.
// Custom domain users (www.tennispromario.com) are redirected back to their
// origin AFTER the OAuth handshake completes on manus.space.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Use window.location.origin so the callback URL is always the deployed
  // manus.space origin (the registered OAuth redirect URI).
  const origin = window.location.origin;
  const callbackUrl = new URL(`${origin}/api/oauth/callback`);
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
