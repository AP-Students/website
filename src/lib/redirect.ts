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
