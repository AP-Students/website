import type { RichCaption, CaptionSegment, CaptionMark } from "./types";
import { isValidUrl } from "./sanitize";

/**
 * Convert a plain string caption (legacy format) into a RichCaption with one
 * segment carrying no marks. This keeps old plain-text captions loadable.
 */
export function plainTextToRichCaption(text: string): RichCaption {
  if (!text) return [];
  return [{ text, marks: [] }];
}

/**
 * Extract the plain-text representation of a RichCaption (used for the image's
 * `alt` attribute and for validation checks visible to authors).
 */
export function richCaptionToPlainText(richCaption: RichCaption | undefined): string {
  if (!richCaption || richCaption.length === 0) return "";
  return richCaption.map((segment) => segment.text).join("");
}

/**
 * Parse an HTML fragment (produced by editing or pasting) into a RichCaption.
 * Only the supported marks (<strong>/<b>, <em>/<i>, <u>, <mark>, <a>) are
 * retained; everything else is flattened to its text content.
 */
export function htmlToRichCaption(html: string): RichCaption {
  if (!html) return [];

  // Parse in a detached document so we never touch the live DOM.
  const doc = document.implementation.createHTMLDocument("");
  const container = doc.createElement("div");
  container.innerHTML = html;

  const segments: CaptionSegment[] = [];

  function walk(node: Node, inheritedMarks: CaptionMark[]) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        if (text.length > 0) {
          segments.push({ text, marks: inheritedMarks.slice() });
        }
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      let marks = inheritedMarks;

      switch (tag) {
        case "strong":
        case "b":
          marks = marks.concat({ type: "bold" });
          break;
        case "em":
        case "i":
          marks = marks.concat({ type: "italic" });
          break;
        case "u":
          marks = marks.concat({ type: "underline" });
          break;
        case "mark":
          marks = marks.concat({ type: "highlight" });
          break;
        case "a": {
          const href = el.getAttribute("href") ?? "";
          if (isValidUrl(href)) {
            marks = marks.concat({ type: "link", href });
          }
          break;
        }
        default:
          // Unknown tags: descend but inherit no new marks.
          break;
      }
      walk(el, marks);
    });
  }

  walk(container, []);
  return segments;
}

/**
 * Serialize a RichCaption to a JSON-safe representation for storage. Currently
 * the RichCaption is already JSON-safe, but this indirection keeps the storage
 * shape stable if internal types change later.
 */
export function serializeRichCaption(rich: RichCaption): RichCaption {
  return rich.map((segment) => ({
    text: segment.text,
    marks: segment.marks.map((mark) => {
      if (mark.type === "link") {
        const href = isValidUrl(mark.href) ? mark.href : "";
        return { type: "link", href };
      }
      return { type: mark.type };
    }),
  }));
}

/**
 * Coerce an unknown persisted value into a safe RichCaption. Handles legacy
 * plain strings, malformed arrays, and partial segment data defensively.
 */
export function coerceRichCaption(value: unknown): RichCaption {
  if (typeof value === "string") return plainTextToRichCaption(value);
  if (!Array.isArray(value)) return [];

  const segments: CaptionSegment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text : "";
    if (!text) continue;
    const rawMarks = record.marks;
    const marks: CaptionMark[] = [];
    if (Array.isArray(rawMarks)) {
      for (const raw of rawMarks) {
        if (!raw || typeof raw !== "object") continue;
        const markRecord = raw as Record<string, unknown>;
        const type = markRecord.type;
        switch (type) {
          case "bold":
          case "italic":
          case "underline":
          case "highlight":
            marks.push({ type });
            break;
          case "link": {
            const href =
              typeof markRecord.href === "string" ? markRecord.href : "";
            if (isValidUrl(href)) marks.push({ type: "link", href });
            break;
          }
          default:
            break;
        }
      }
    }
    segments.push({ text, marks });
  }
  return segments;
}
