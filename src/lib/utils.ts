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
