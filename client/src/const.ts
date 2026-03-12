export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The manus.space URL is the only registered OAuth redirect URI.
// All sign-in flows must use this as the callback origin regardless of which
// domain the user is currently visiting. After the OAuth handshake completes,
// the server redirects to tennispromario.com/api/oauth/set-session to set the
// session cookie on the custom domain.
const CANONICAL_OAUTH_ORIGIN = "https://tennispro-kzzfscru.manus.space";

export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Always use the registered manus.space callback URL.
  // Embed returnPath as a query param so the server can redirect the user
  // back to the correct page after login.
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
