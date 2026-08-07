import DOMPurify from "dompurify";

const allowedTags = ["strong", "b", "em", "i", "u", "mark", "br", "div"];

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
    if (/background(-color)?\s*:\s*(?!transparent)/i.test(style)) {
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
  template.content
    .querySelectorAll("strong, em, u, mark")
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
