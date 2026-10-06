// Any origin works as long as it is not a real one; it only anchors parsing.
const PLACEHOLDER_ORIGIN = "https://fivehive.invalid";

/**
 * Turns a `?redirect=` value into a path on this site, or null. Without this,
 * a crafted sign-in link could send someone to another site the moment they
 * signed in. Resolving against a placeholder origin and checking the origin
 * survived is what catches the less obvious forms: `//host`, `/\host`, and the
 * tabs and newlines the URL parser strips out before it reads the host.
 */
export const getSafeRedirectPath = (
  value: string | null | undefined,
): string | null => {
  if (!value?.startsWith("/")) {
    return null;
  }

  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);

    if (url.origin !== PLACEHOLDER_ORIGIN) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

// Sending someone back to a sign-in page after signing in would just loop.
const isAuthPage = (pathname: string) =>
  /^\/(login|signup)(\/|$)/.test(pathname);

/**
 * Where a "Log in" or "Sign up" link should point so that signing in brings
 * the visitor back to `returnTo` instead of dropping them on the homepage. The
 * homepage and the sign-in pages are left off: the homepage is where sign-in
 * lands anyway, and returning to a sign-in page would loop.
 */
export const getAuthHref = (
  authPath: "/login" | "/signup",
  returnTo: string | null | undefined,
) => {
  const path = getSafeRedirectPath(returnTo);

  if (!path) {
    return authPath;
  }

  const { pathname } = new URL(path, PLACEHOLDER_ORIGIN);

  if (pathname === "/" || isAuthPage(pathname)) {
    return authPath;
  }

  return `${authPath}?redirect=${encodeURIComponent(path)}`;
};
