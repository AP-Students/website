/*
 * Turning a text block into a Code block and back, for the editor's
 * "Convert to" menu.
 *
 * Editor.js converts a block in three steps: the old tool exports its data as
 * an HTML string, that string is cleaned with the new tool's sanitizer, and
 * the new tool imports what is left. Text blocks hold HTML, but a Code block
 * holds plain text, so these functions go between the two: HTML in, the text
 * a reader saw out, and back again.
 */

const LINE_BREAK = /<br\s*\/?>/i;
// Tags, including attribute values in quotes that may contain ">".
const TAG = /<(?:[^>"']|"[^"]*"|'[^']*')*>/g;
// The whitespace HTML collapses. A no-break space (&nbsp;) is not in it.
const COLLAPSIBLE_SPACE = /[ \t\n\r\f]+/g;
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

/** Decodes character references such as `&lt;`, `&#60;` and `&#x3C;`. */
function decodeEntities(text: string): string {
  return text.replace(
    /&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g,
    (entity, name: string) => {
      if (name.startsWith("#")) {
        const codePoint =
          name[1] === "x" || name[1] === "X"
            ? parseInt(name.slice(2), 16)
            : parseInt(name.slice(1), 10);
        return codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }
      return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
    },
  );
}

/** The text one line of a text block shows: tags dropped, spaces as rendered. */
function lineText(html: string): string {
  const shown = html
    .replace(TAG, "")
    .replace(COLLAPSIBLE_SPACE, " ")
    // A space at the start or end of a line isn't shown either.
    .replace(/^ | $/g, "");
  // A typed indent is stored as &nbsp;, which code wants as plain spaces.
  return decodeEntities(shown).replace(/\u00a0/g, " ");
}

/**
 * The code for a text block's HTML: each `<br>` starts a new line, formatting
 * such as bold and links is dropped, entities like `&lt;` become the
 * characters they stand for, and spaces follow what the block showed. So
 * typed indentation (stored as `&nbsp;`) is kept, while spaces HTML never
 * displayed are not. Nothing in the HTML is run or rendered.
 */
export function htmlToCode(html: string): string {
  const lines = html.split(LINE_BREAK).map(lineText);
  // A text block doesn't show a line break at the very end as an empty line.
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * The HTML for a Code block's text, escaped so code like `<b>` is shown, not
 * applied. Lines are joined with " <br>": most blocks drop the `<br>` when
 * they import it, and the space then keeps the lines from running together.
 */
export function codeToHtml(code: string): string {
  return code
    .split(/\r\n|\r|\n/)
    .map(escapeHtml)
    .join(" <br>");
}

/** A list item as the list tool saves it, or a plain string in old lists. */
export type ListItemLike =
  | string
  | { content?: string; items?: ListItemLike[] };

/**
 * A list's items as HTML, one line per item, nested items after their parent.
 * Code gets an item per line; other blocks get the items separated by spaces,
 * as the list tool's own export does.
 */
export function listItemsToHtml(items: readonly ListItemLike[]): string {
  const lines: string[] = [];
  const visit = (list: readonly ListItemLike[]) => {
    for (const item of list) {
      if (typeof item === "string") {
        lines.push(item);
        continue;
      }
      lines.push(item.content ?? "");
      visit(item.items ?? []);
    }
  };
  visit(items);
  return lines.join(" <br>");
}
