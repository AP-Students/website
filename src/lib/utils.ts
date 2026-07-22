import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/[^a-z1-9 ]+/g, "")
    .replace(/\s/g, "-");
}

/**
 * True when a file (by MIME type or name) is an SVG. Some browsers report an
 * empty `type` for SVGs, so the filename extension is checked as a fallback.
 */
export function isSvgFileName(name?: string | null): boolean {
  return name?.toLowerCase().endsWith(".svg") ?? false;
}

/**
 * Content type to attach when uploading to Firebase Storage. Returns the file's
 * own MIME type, falling back to image/svg+xml for SVGs that report an empty
 * type so they are served (and rendered) as images rather than octet-streams.
 */
export function resolveUploadContentType(file: File): string | undefined {
  return file.type || (isSvgFileName(file.name) ? "image/svg+xml" : undefined);
}

/**
 * Extracts an SVG's intrinsic aspect ratio from its markup. Most SVGs only
 * declare a `viewBox` (no `width`/`height`), so an `<img>` referencing one
 * has no natural size to fall back on and can collapse to the browser's
 * 300x150 replaced-element default. Reading the ratio here lets the caller
 * size the SVG the same way it sizes PNG/JPG (proportional, capped by CSS)
 * instead of forcing every SVG to an identical fixed width.
 */
export function parseSvgIntrinsicSize(
  svgMarkup: string,
): { width: number; height: number } | null {
  const num = String.raw`[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?`;
  const viewBoxMatch = new RegExp(
    String.raw`viewBox\s*=\s*["']\s*${num}(?:[,\s]+)${num}(?:[,\s]+)(${num})(?:[,\s]+)(${num})\s*["']`,
    "i",
  ).exec(svgMarkup);
  if (viewBoxMatch?.[1] && viewBoxMatch[2]) {
    const width = parseFloat(viewBoxMatch[1]);
    const height = parseFloat(viewBoxMatch[2]);
    if (width > 0 && height > 0) return { width, height };
  }

  // Fall back to explicit width/height attributes (ignoring % values, which
  // give no absolute ratio) if there's no usable viewBox.
  const widthMatch =
    /(?:^|[^\w-])width\s*=\s*["']\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)(?:\s*(?:px|pt|pc|mm|cm|in))?\s*["']/i.exec(
      svgMarkup,
    );
  const heightMatch =
    /(?:^|[^\w-])height\s*=\s*["']\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)(?:\s*(?:px|pt|pc|mm|cm|in))?\s*["']/i.exec(
      svgMarkup,
    );
  if (widthMatch?.[1] && heightMatch?.[1]) {
    const width = parseFloat(widthMatch[1]);
    const height = parseFloat(heightMatch[1]);
    if (width > 0 && height > 0) return { width, height };
  }

  return null;
}
