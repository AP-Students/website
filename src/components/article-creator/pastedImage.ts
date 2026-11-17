// Images pasted as a link instead of a file. Google Docs does this: the
// clipboard has <img src="https://lh7-rt.googleusercontent.com/...">.
// We download the image so it can be uploaded like a normal file.

const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
};

// Give up on a pasted image after this long.
export const PASTED_IMAGE_TIMEOUT_MS = 30_000;

export function pastedImageFileName(mimeType: string): string {
  const type = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = EXTENSIONS[type];
  return extension ? `pasted-image.${extension}` : "pasted-image";
}

// Throws if the image can't be downloaded (no CORS, broken link, not an
// image, or too slow), so the editor shows an upload error instead of
// spinning forever.
export async function fetchPastedImage(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = PASTED_IMAGE_TIMEOUT_MS,
): Promise<File> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `The image request failed with status ${response.status}.`,
      );
    }
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      throw new Error(`The link isn't an image (${blob.type || "no type"}).`);
    }
    return new File([blob], pastedImageFileName(blob.type), {
      type: blob.type,
    });
  } finally {
    clearTimeout(timer);
  }
}
