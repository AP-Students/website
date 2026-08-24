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
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: [] });
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
