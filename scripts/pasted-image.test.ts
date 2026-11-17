import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fetchPastedImage,
  pastedImageFileName,
} from "../src/components/article-creator/pastedImage.ts";

// A real 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const respondWith =
  (response: Response): typeof fetch =>
  () =>
    Promise.resolve(response);

test("file names get the extension for the image type", () => {
  assert.equal(pastedImageFileName("image/png"), "pasted-image.png");
  assert.equal(pastedImageFileName("image/jpeg"), "pasted-image.jpg");
  assert.equal(pastedImageFileName("image/svg+xml"), "pasted-image.svg");
  assert.equal(pastedImageFileName("IMAGE/WEBP"), "pasted-image.webp");
  assert.equal(pastedImageFileName("image/png; foo=bar"), "pasted-image.png");
  assert.equal(pastedImageFileName("image/x-unknown"), "pasted-image");
  assert.equal(pastedImageFileName(""), "pasted-image");
});

test("a Google Docs image link downloads as a PNG file", async () => {
  const file = await fetchPastedImage(
    "https://lh7-rt.googleusercontent.com/docsz/abc?key=xyz",
    respondWith(
      new Response(PNG, { headers: { "content-type": "image/png" } }),
    ),
  );
  assert.equal(file.name, "pasted-image.png");
  assert.equal(file.type, "image/png");
  assert.equal(file.size, PNG.length);
});

test("an image pasted as a data: URL works", async () => {
  const file = await fetchPastedImage(
    `data:image/png;base64,${PNG.toString("base64")}`,
  );
  assert.equal(file.type, "image/png");
  assert.equal(file.size, PNG.length);
});

test("a broken link fails instead of hanging", async () => {
  await assert.rejects(
    fetchPastedImage(
      "https://example.com/missing.png",
      respondWith(new Response("not found", { status: 404 })),
    ),
    /status 404/,
  );
});

test("a link that isn't an image fails", async () => {
  await assert.rejects(
    fetchPastedImage(
      "https://example.com/page",
      respondWith(
        new Response("<html></html>", {
          headers: { "content-type": "text/html" },
        }),
      ),
    ),
    /isn't an image/,
  );
});

test("a site that blocks the request (CORS) fails", async () => {
  const blocked: typeof fetch = () =>
    Promise.reject(new TypeError("Failed to fetch"));
  await assert.rejects(
    fetchPastedImage("https://example.com/pic.png", blocked),
    /Failed to fetch/,
  );
});

test("a download that never finishes gives up after the timeout", async () => {
  const never: typeof fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    });
  const started = Date.now();
  await assert.rejects(
    fetchPastedImage("https://example.com/slow.png", never, 50),
    /aborted/,
  );
  assert.ok(Date.now() - started < 2000);
});
