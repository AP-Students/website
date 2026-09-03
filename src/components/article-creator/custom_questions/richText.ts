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
