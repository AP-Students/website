import type { ConversionConfig, SanitizerConfig } from "@editorjs/editorjs";
import CodeTool from "@editorjs/code";
import List from "@editorjs/list";
import {
  codeToHtml,
  htmlToCode,
  listItemsToHtml,
  type ListItemLike,
} from "./codeConversion";

/*
 * Editor.js offers a block type in "Convert to" only when its tool has a
 * `conversionConfig`, which the Code tool doesn't ship with. These subclasses
 * add one, so text blocks can be turned into Code and Code into text blocks,
 * without changing how either tool edits, saves, or renders.
 */

/*
 * Backspace at the start of a block, or Delete at the end of one, makes
 * Editor.js merge the two blocks whenever the second one can export its data.
 * Code needs an export to be converted back from the menu, but merging code
 * into the paragraph above would flatten it into one line and remove the Code
 * block. So while one of those keys is being handled, Code reports no export,
 * and Editor.js just moves the caret, as it did before Code could convert.
 * Editor.js decides on the merge during the keydown itself, and this listener
 * runs before it, in the capture phase.
 */
let handlingMergeKey = false;
if (typeof window !== "undefined") {
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      handlingMergeKey = true;
      setTimeout(() => {
        handlingMergeKey = false;
      }, 0);
    },
    true,
  );
}

/** What the Code tool saves. */
type CodeData = { code?: string };

/** The Code tool, made convertible to and from text blocks. */
export class CodeBlock extends CodeTool {
  static get conversionConfig() {
    return {
      import: (html: string): CodeData => ({ code: htmlToCode(html) }),
      ...(handlingMergeKey
        ? {}
        : { export: (data: CodeData) => codeToHtml(data.code ?? "") }),
    };
  }

  /**
   * `code: true` is the Code tool's own rule: it keeps the saved code exactly
   * as typed. `br` is for conversion: Editor.js cleans the exported HTML with
   * this config's keys as the tags to keep, so without it every `<br>` would
   * be gone before `import` could turn it into a new line.
   */
  static get sanitize(): SanitizerConfig {
    return { code: true, br: true };
  }
}

/** The list tool's own conversion config (its package ships no types here). */
const listConversion = (List as { conversionConfig: ConversionConfig })
  .conversionConfig;

/** The list tool, exporting one line per item so Code gets one line each. */
export class ListBlock extends List {
  static get conversionConfig(): ConversionConfig {
    return {
      ...listConversion,
      export: (data: { items?: ListItemLike[] }) =>
        listItemsToHtml(data.items ?? []),
    };
  }
}
