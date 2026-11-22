import { decode } from "html-entities";

// Article blocks are stored as small HTML snippets: text with entities
// ("a &lt; b") plus the inline formatting the editor adds (<b>, <a href>,
// <mark class="cdx-marker">...). These helpers put that, and the few values
// that end up in attributes, on the page without letting anything else in.
// No DOM needed, so they work the same on the server and in the browser.

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// A URL for href/src, escaped for an attribute, or null if it isn't one we
// allow: http(s), relative, and mailto: only where asked. Browsers decode
// entities and skip whitespace and control characters before reading the
// scheme, so the check does too ("jav&#x61;script:" is still javascript:).
export function safeUrl(
  value: unknown,
  { mailto = false, relative = true } = {},
): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const url = decode(value).trim();
  // eslint-disable-next-line no-control-regex
  const compact = url.replace(/[\s\u0000-\u001f\u007f-\u009f]/g, "");
  const colon = compact.indexOf(":");
  const pathStart = compact.search(/[/?#]/);
  const scheme =
    colon > 0 && (pathStart === -1 || colon < pathStart)
      ? compact.slice(0, colon).toLowerCase()
      : null;
  const allowed =
    scheme === null
      ? relative
      : scheme === "http" ||
        scheme === "https" ||
        (mailto && scheme === "mailto");
  return allowed ? escapeHtml(url) : null;
}

const INLINE_TAGS = new Set([
  "a",
  "b",
  "br",
  "code",
  "em",
  "i",
  "mark",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
]);
const CLASS_TAGS = new Set(["code", "mark", "span", "u"]);
const TAG =
  /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTRIBUTE =
  /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function rebuildTag(name: string, closing: boolean, attributes: string) {
  if (closing) return name === "br" ? "" : `</${name}>`;
  const kept: string[] = [];
  for (const match of attributes.matchAll(ATTRIBUTE)) {
    const attribute = match[1]!.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name === "a" && attribute === "href") {
      const href = safeUrl(value, { mailto: true });
      if (href) kept.push(`href="${href}"`);
    } else if (name === "a" && attribute === "target") {
      if (decode(value).trim() === "_blank")
        kept.push('target="_blank" rel="noopener noreferrer"');
    } else if (attribute === "class" && CLASS_TAGS.has(name)) {
      const classes = decode(value).trim();
      if (/^[\w -]+$/.test(classes)) kept.push(`class="${classes}"`);
    }
  }
  return `<${name}${kept.length ? ` ${kept.join(" ")}` : ""}>`;
}

// Keeps the editor's inline formatting and nothing else. A known tag is
// rebuilt with only the attributes listed above; any other tag, comment, or
// stray "<" is escaped, so it shows as the text it is.
export function sanitizeInlineHtml(html: unknown): string {
  if (typeof html !== "string") return "";
  let out = "";
  let last = 0;
  for (const match of html.matchAll(TAG)) {
    out += html.slice(last, match.index).replaceAll("<", "&lt;");
    const name = match[2]!.toLowerCase();
    out += INLINE_TAGS.has(name)
      ? rebuildTag(name, match[1] === "/", match[3] ?? "")
      : escapeHtml(match[0]);
    last = match.index + match[0].length;
  }
  return out + html.slice(last).replaceAll("<", "&lt;");
}

// For values that pick a CSS class or similar from a fixed set.
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
