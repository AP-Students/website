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

// Same limit as images picked from disk.
export const PASTED_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

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
  maxBytes: number = PASTED_IMAGE_MAX_BYTES,
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
    const type =
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() ?? "";
    if (!type.startsWith("image/")) {
      throw new Error(`The link isn't an image (${type || "no type"}).`);
    }
    // Check the size before and while downloading, so a huge file is never
    // fully loaded into the tab just to be rejected afterwards.
    if (Number(response.headers.get("content-length")) > maxBytes) {
      throw new Error("The image is too big.");
    }
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = response.body?.getReader();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("The image is too big.");
      }
      chunks.push(value);
    }
    return new File(chunks as BlobPart[], pastedImageFileName(type), {
      type,
    });
  } finally {
    clearTimeout(timer);
  }
}
