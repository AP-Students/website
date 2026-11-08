import DOMPurify from "dompurify";

/**
 * The tags the question and response editors can actually produce. `sup`,
 * `sub` and the list tags are here because the FRQ response toolbar has
 * buttons that emit them: leaving them off meant a student's own superscript
 * survived into storage and was then stripped back out by the page that read
 * the response back to them, so "x²" was shown to its author as "x2".
 *
 * All of these are attribute-free structural tags, and `ALLOWED_ATTR` stays
 * empty, so widening the list adds no attack surface.
 */
const allowedTags = [
  "strong",
  "b",
  "em",
  "i",
  "u",
  "mark",
  "br",
  "div",
  "sup",
  "sub",
  "ul",
  "ol",
  "li",
];

/**
 * Questions intentionally support a very small rich-text vocabulary. Keeping
 * this canonical at both edit and render time also makes legacy plain text a
 * safe, compatible input.
 */
export function sanitizeQuestionRichText(value: string): string {
  if (typeof window === "undefined") {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: [],
    });
  }

  const template = document.createElement("template");
  // Normalize browser editing-command output before sanitizing attributes away.
  template.innerHTML = value;
  template.content.querySelectorAll("b").forEach((node) => {
    const strong = document.createElement("strong");
    strong.innerHTML = node.innerHTML;
    node.replaceWith(strong);
  });
  template.content.querySelectorAll("i").forEach((node) => {
    const em = document.createElement("em");
    em.innerHTML = node.innerHTML;
    node.replaceWith(em);
  });
  // Browser editing commands can emit styled spans for a highlight. Convert
  // those to the semantic mark element before storing the value.
  template.content.querySelectorAll("span").forEach((node) => {
    const style = node.getAttribute("style") ?? "";
    const backgroundValue = style.match(
      /background(?:-color)?\s*:\s*([^;]+)/i,
    )?.[1];
    // Chromium commonly serializes `hiliteColor: transparent` as rgba(0, 0,
    // 0, 0). Treat both forms as removal, rather than converting them back
    // into a mark on every editor update.
    const isTransparentBackground =
      !backgroundValue ||
      /transparent|rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(
        backgroundValue,
      );
    if (backgroundValue && !isTransparentBackground) {
      const mark = document.createElement("mark");
      mark.innerHTML = node.innerHTML;
      node.replaceWith(mark);
    } else if (/text-decoration\s*:\s*underline/i.test(style)) {
      const underline = document.createElement("u");
      underline.innerHTML = node.innerHTML;
      node.replaceWith(underline);
    } else {
      node.replaceWith(...Array.from(node.childNodes));
    }
  });
  // List tags are deliberately absent: an empty `li` is a bullet the author is
  // still typing into, and removing it would collapse the list under the caret.
  template.content
    .querySelectorAll("strong, em, u, mark, sup, sub")
    .forEach((node) => {
      if (!node.textContent && !node.querySelector("br")) node.remove();
    });
  return DOMPurify.sanitize(template.innerHTML, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
  });
}

/**
 * The one highlight colour: `RichTextEditor` applies it with `hiliteColor`, and
 * it is Tailwind's `yellow-200`, which every surface paints a `mark` with.
 */
export const HIGHLIGHT_COLOR = "#fef08a";

const FRAGMENT_START = "<!--StartFragment-->";
const FRAGMENT_END = "<!--EndFragment-->";

/**
 * On Windows the clipboard hands a page its HTML as a whole document —
 * `<html>\r\n<body>\r\n<!--StartFragment-->…<!--EndFragment-->\r\n</body>\r\n</html>`.
 * Only the part between the markers was copied. The line breaks around it
 * belong to the wrapper, and the editor's `white-space: pre-wrap` showed each
 * one as an empty line around the pasted text.
 */
export function extractClipboardFragment(html: string): string {
  const start = html.indexOf(FRAGMENT_START);
  const end = html.lastIndexOf(FRAGMENT_END);
  if (start === -1 || end < start) return html;
  return html.slice(start + FRAGMENT_START.length, end);
}

/**
 * Whether a CSS `font-weight` value reads as bold. 600 (semibold) and up is
 * where browsers switch to a bold face; an empty value means "not set here".
 */
export function isBoldFontWeight(value: string): boolean {
  const weight = value.trim().toLowerCase();
  if (weight === "bold" || weight === "bolder") return true;
  if (weight === "") return false;
  const numeric = Number(weight);
  return Number.isFinite(numeric) && numeric >= 600;
}

/**
 * Cuts clipboard HTML down to what was copied, with bold expressed as tags,
 * before any editor reads it.
 *
 * - Windows wraps the copy in a CRLF-padded document (see
 *   `extractClipboardFragment`). Kept, those line breaks showed as empty lines
 *   in a question box and as two stray spaces in a caption.
 * - Google Docs wraps every copy in `<b style="font-weight:normal"
 *   id="docs-internal-guid-…">` and marks its real bold on spans with
 *   `font-weight:700`. Every editor here reads `<b>` as bold and drops span
 *   styles, so anything pasted from Docs came out entirely bold. The wrapper is
 *   unwrapped, and a bold span gets a `<strong>` so the real bold survives.
 */
export function normalizePastedHtml(html: string): string {
  const fragment = extractClipboardFragment(html);
  if (typeof window === "undefined") return fragment;

  const template = document.createElement("template");
  template.innerHTML = fragment;
  // Clipboard metadata (`<meta charset="utf-8">` from Docs and from Chrome on
  // macOS). Left in front of the text, it made the sanitizer's HTML parser drop
  // a leading space from the paste.
  template.content.querySelectorAll("meta").forEach((node) => node.remove());
  template.content
    .querySelectorAll<HTMLElement>("b, strong")
    .forEach((node) => {
      const weight = node.style.fontWeight;
      if (weight && !isBoldFontWeight(weight)) {
        node.replaceWith(...Array.from(node.childNodes));
      }
    });
  template.content.querySelectorAll<HTMLElement>("span").forEach((node) => {
    if (!isBoldFontWeight(node.style.fontWeight)) return;
    if (node.closest("b, strong")) return;
    // Inside the span rather than around it, so the span's other styles (a
    // highlight background, an underline) still reach the editor's sanitizer.
    const strong = document.createElement("strong");
    strong.append(...Array.from(node.childNodes));
    node.append(strong);
    // The weight is a tag now. Dropping it from the style keeps a second pass
    // (the article editor's paste listener runs before a question box's own
    // handler) from wrapping it in another `<strong>`.
    node.style.removeProperty("font-weight");
  });
  return template.innerHTML;
}

/** Whether a CSS colour (hex, `rgb()` or `rgba()`) is `HIGHLIGHT_COLOR`. */
export function isHighlightColor(value: string): boolean {
  const color = value.trim().toLowerCase();
  if (color === HIGHLIGHT_COLOR) return true;
  const channels = color.match(
    /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
  );
  if (!channels) return false;
  if (channels[4] !== undefined && parseFloat(channels[4]) === 0) return false;
  const hex = channels
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}` === HIGHLIGHT_COLOR;
}

/**
 * Sanitizes HTML from a paste. A copy serializes the source text's *computed*
 * style onto a span, including the background of whatever it sat on, and
 * `sanitizeQuestionRichText` reads any span background as a highlight. That is
 * right for this editor's own `hiliteColor` output but wrong for a copy: text
 * copied off any white surface — another question box included — was pasted
 * back highlighted. Only a background in the highlight colour survives here, so
 * highlighted text still keeps its highlight when copied between boxes.
 */
export function sanitizePastedQuestionRichText(html: string): string {
  const fragment = normalizePastedHtml(html);
  if (typeof window === "undefined") return sanitizeQuestionRichText(fragment);

  const template = document.createElement("template");
  template.innerHTML = fragment;
  template.content.querySelectorAll<HTMLElement>("[style]").forEach((node) => {
    if (isHighlightColor(node.style.backgroundColor)) return;
    node.style.removeProperty("background");
    node.style.removeProperty("background-color");
  });
  return sanitizeQuestionRichText(template.innerHTML);
}

export function richTextToPlainText(value: string): string {
  if (typeof window === "undefined") return value.replace(/<[^>]*>/g, "");
  const template = document.createElement("template");
  template.innerHTML = sanitizeQuestionRichText(value);
  return template.content.textContent ?? "";
}

/**
 * List markers and indent, kept here because three separate surfaces have to
 * agree on them: the MCQ authoring box, the FRQ response box, and the renderer
 * that reads either one back. Tailwind's preflight resets `list-style`,
 * `margin` and `padding` on `ul`/`ol`, so every surface showing a list has to
 * ask for them again — and when one of them forgot, bullets a student typed
 * were simply invisible while they typed them (#357).
 *
 * The plain and `[&_…]` forms are both spelled out rather than derived from
 * one another because Tailwind's scanner only sees literal class strings.
 */
export const UNORDERED_LIST_CLASSES = "my-2 list-disc pl-6";

export const ORDERED_LIST_CLASSES = "my-2 list-decimal pl-6";

/** The same rules, applied from a contentEditable host's own class list. */
export const RICH_TEXT_LIST_CLASSES =
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6";
