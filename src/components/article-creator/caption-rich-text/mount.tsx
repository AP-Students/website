import { createRoot, type Root } from "react-dom/client";
import { CaptionRichTextEditor } from "./CaptionRichTextEditor";
import { coerceRichCaption } from "./convert";
import type { RichCaption } from "./types";

/**
 * Generated to mark placeholder caption containers that we mount React into.
 * This CSS class lets CustomImage quickly locate the active node within a block.
 */
export const RICH_CAPTION_HOST_ATTR = "data-rich-caption-host";

/**
 * Mount the CaptionRichTextEditor React component into a DOM host and surface
 * the live value through a callback. The host replaces EditorJS' native
 * contenteditable caption element so the rich-text editor becomes the new
 * source of truth. Returns an unmount function.
 */
export function mountRichCaptionEditor(args: {
  host: HTMLElement;
  initial: RichCaption;
  placeholder?: string;
  onChange: (next: RichCaption) => void;
}): { unmount(): void } {
  let root: Root | null = null;
  // Reuse an existing React root if we're remounting into the same host.
  if (!args.host.hasAttribute(RICH_CAPTION_HOST_ATTR) || !rootCache.has(args.host)) {
    root = createRoot(args.host);
    rootCache.set(args.host, root);
    args.host.setAttribute(RICH_CAPTION_HOST_ATTR, "true");
  } else {
    root = rootCache.get(args.host) ?? null;
  }

  const safeCaption: RichCaption = coerceRichCaption(args.initial);

  root?.render(
    <CaptionRichTextEditor
      value={safeCaption}
      placeholder={args.placeholder}
      onChange={(next) => args.onChange(next)}
    />,
  );

  return {
    unmount() {
      const cached = rootCache.get(args.host);
      if (cached) {
        cached.unmount();
        rootCache.delete(args.host);
        args.host.removeAttribute(RICH_CAPTION_HOST_ATTR);
      }
    },
  };
}

const rootCache = new WeakMap<HTMLElement, Root>();

/**
 * Convert a (possibly legacy) caption value into the initial React render.
 * Accepts either a string (legacy plain text) or a RichCaption array.
 */
export function resolveInitialRichCaption(value: unknown): RichCaption {
  if (!value) return [];
  return coerceRichCaption(value);
}
