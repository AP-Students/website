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
// Alert boxes allow line breaks, so pressing Enter in one makes the browser
// wrap each line in a <div>. Pasting into one can bring paragraphs and lists.
const LINE_TAGS = new Set(["div", "p", "ul", "ol", "li"]);
const CLASS_TAGS = new Set(["code", "mark", "span", "u"]);
const TAG =
  /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTRIBUTE =
  /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function rebuildTag(name: string, attributes: string) {
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
// stray "<" is escaped, so it shows as the text it is. With `lines`, plain
// <div>, <p> and lists are kept too (no attributes), for alert boxes.
export function sanitizeInlineHtml(
  html: unknown,
  { lines = false } = {},
): string {
  if (typeof html !== "string") return "";
  let out = "";
  let last = 0;
  // Every tag that's opened is closed again, and a closing tag with nothing
  // open to match is dropped, so the result can't close the block it sits in
  // (or leave the rest of the page bold).
  const open: string[] = [];
  const openCount = new Map<string, number>();
  const count = (name: string, change: number) =>
    openCount.set(name, (openCount.get(name) ?? 0) + change);
  for (const match of html.matchAll(TAG)) {
    out += html.slice(last, match.index).replaceAll("<", "&lt;");
    last = match.index + match[0].length;
    const name = match[2]!.toLowerCase();
    if (!INLINE_TAGS.has(name) && !(lines && LINE_TAGS.has(name))) {
      out += escapeHtml(match[0]);
    } else if (name === "br") {
      if (match[1] !== "/") out += "<br>";
    } else if (match[1] !== "/") {
      out += rebuildTag(name, match[3] ?? "");
      open.push(name);
      count(name, 1);
    } else if (openCount.get(name)) {
      // Closes anything opened inside it that wasn't closed, too.
      while (open.length) {
        const closing = open.pop()!;
        count(closing, -1);
        out += `</${closing}>`;
        if (closing === name) break;
      }
    }
  }
  out += html.slice(last).replaceAll("<", "&lt;");
  while (open.length) out += `</${open.pop()}>`;
  return out;
}

// For values that pick a CSS class or similar from a fixed set.
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
