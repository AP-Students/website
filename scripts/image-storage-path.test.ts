import assert from "node:assert/strict";
import { test } from "node:test";
import { imageStoragePath } from "../src/components/article-creator/imageStoragePath.ts";

test("images with the same name uploaded in the same millisecond get different paths", () => {
  const now = 1_795_348_800_000;
  const paths = Array.from({ length: 50 }, () =>
    imageStoragePath("pasted-image.png", now),
  );
  assert.equal(new Set(paths).size, paths.length);
});

test("the path keeps the images folder, the time and the file name", () => {
  const path = imageStoragePath("diagram.svg", 1234);
  assert.match(path, /^images\/1234_[0-9a-f]{12}_diagram\.svg$/);
  // The renderer spots SVGs by the ending.
  assert.ok(path.toLowerCase().endsWith(".svg"));
});
