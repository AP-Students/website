// Only allow these HTML elements and attributes for rich-text captions
const ALLOWED_TAGS = new Set(["strong", "em", "u", "mark", "a"]);
const ALLOWED_ATTRS = new Set(["href", "rel", "target"]);

// Regex patterns for URL validation
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
const SCHEME_PREFIX = /^(https?:|mailto:)/i;

/**
 * Validate a caption link URL. Beyond rejecting dangerous schemes, this uses
 * the URL parser to reject malformed URLs (e.g. missing host) and to resolve
 * the *actual* scheme rather than trusting the raw string prefix. Any
 * embedded whitespace is rejected outright, which also defeats tricks like
 * sneaking "javascript:" after a leading space or tab. Bare "//host/path"
 * links are rejected too, since browsers resolve those to an arbitrary
 * external host using the current page's scheme (open-redirect / phishing
 * risk) even though they start with what looks like a single "/". The same
 * applies to a leading "/\" (or any second character of "/" or "\"): the
 * WHATWG URL parser treats "\" exactly like "/" for http(s) URLs, so
 * "/\evil.com" resolves to "https://evil.com" in every major browser even
 * though it isn't a "//" prefix.
 */
export function isValidUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return false;
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return false;

  if (trimmed.startsWith("/") && trimmed[1] !== "/" && trimmed[1] !== "\\") {
    return true;
  }

  if (!SCHEME_PREFIX.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:"
    );
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!isValidUrl(trimmed)) return "";
  return trimmed;
}

/**
 * Strip every tag and attribute we don't allow from an HTML fragment. Runs
 * without a DOM so it can be used during server rendering. This is a deliberate
 * whitelist implementation (no DOMPurify dependency) so the same module is
 * usable from both client and server code paths.
 */
export function sanitizeCaptionHtml(html: string): string {
  if (!html) return "";

  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  return html.replace(tagPattern, (full, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    const isClosing = full.startsWith("</");
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (isClosing) return `</${tag}>`;

    // Whitelist attributes: only href, rel, target on <a>.
    const attrPattern =
      /([a-zA-Z][a-zA-Z0-9_-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let cleanedAttrs = "";
    let m: RegExpExecArray | null;
    while ((m = attrPattern.exec(attrs)) !== null) {
      const name = (m[1] ?? "").toLowerCase();
      const value = m[2] ?? m[3] ?? m[4] ?? "";
      if (!ALLOWED_ATTRS.has(name)) continue;
      if (name === "href") {
        if (!isValidUrl(value)) continue;
        cleanedAttrs += ` href="${value.replace(/"/g, "")}"`;
      } else {
        cleanedAttrs += ` ${name}="${value.replace(/"/g, "")}"`;
      }
    }
    return `<${tag}${cleanedAttrs}>`;
  });
}
