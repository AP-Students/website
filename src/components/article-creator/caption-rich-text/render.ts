import { sanitizeCaptionHtml, isValidUrl, sanitizeUrl } from "./sanitize";
import type { RichCaption, CaptionSegment, CaptionLinkMark } from "./types";

const AMP = String.fromCharCode(38);
const LT = String.fromCharCode(60);
const GT = String.fromCharCode(62);
const QUOT = String.fromCharCode(34);

function htmlEncode(str: string): string {
  return str
    .replace(/&/g, AMP + "amp;")
    .replace(/</g, AMP + "lt;")
    .replace(/>/g, AMP + "gt;")
    .replace(/"/g, AMP + "quot;");
}

function wrap(tag: string, inner: string): string {
  return LT + tag + GT + inner + LT + "/" + tag + GT;
}

// Emits the same semantic tags (<strong>/<em>/<u>/<mark>/<a>) that
// convert.ts's htmlToRichCaption parses back into marks, so a segment
// survives a render -> re-parse round trip (e.g. on the next keystroke)
// without losing formatting. Marks nest inside one another so a link can
// combine with bold/italic/underline/highlight instead of one replacing
// the others.
function renderSegmentToHtml(segment: CaptionSegment): string {
  let html = htmlEncode(segment.text);
  const has = (type: string) => segment.marks.some((m) => m.type === type);

  if (has("bold")) html = wrap("strong", html);
  if (has("italic")) html = wrap("em", html);
  if (has("underline")) html = wrap("u", html);
  if (has("highlight")) html = wrap("mark", html);

  const linkMark = segment.marks.find(
    (m): m is CaptionLinkMark => m.type === "link",
  );
  if (linkMark && isValidUrl(linkMark.href)) {
    const safeHref = sanitizeUrl(linkMark.href);
    const open =
      LT +
      "a href=" +
      QUOT +
      safeHref +
      QUOT +
      " target=" +
      QUOT +
      "_blank" +
      QUOT +
      " rel=" +
      QUOT +
      "noopener noreferrer" +
      QUOT +
      GT;
    html = open + html + LT + "/a" + GT;
  }

  return html;
}

export function renderRichCaptionToHtml(richCaption: RichCaption): string {
  const html = richCaption
    .map((segment) => renderSegmentToHtml(segment))
    .join("");
  return sanitizeCaptionHtml(html);
}
