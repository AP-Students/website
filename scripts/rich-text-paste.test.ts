import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HIGHLIGHT_COLOR,
  extractClipboardFragment,
  isHighlightColor,
} from "../src/components/article-creator/custom_questions/richText.ts";

/** What Chrome put on the clipboard when "test" was copied out of a question box. */
const copiedSpan =
  '<span style="color: rgb(33, 33, 8); font-size: 14px; white-space: pre-wrap; background-color: rgb(255, 255, 255); display: inline !important;">test</span>';

test("keeps only the copied fragment of a Windows clipboard document", () => {
  const windowsHtml = `<html>\r\n<body>\r\n<!--StartFragment-->${copiedSpan}<!--EndFragment-->\r\n</body>\r\n</html>`;

  // The CRLFs around the markers were each shown as an empty line in the editor.
  assert.equal(extractClipboardFragment(windowsHtml), copiedSpan);
});

test("leaves clipboard HTML without fragment markers unchanged", () => {
  const macHtml = `<meta charset='utf-8'>${copiedSpan}`;

  assert.equal(extractClipboardFragment(macHtml), macHtml);
  assert.equal(extractClipboardFragment("plain words"), "plain words");
});

test("ignores fragment markers that are out of order", () => {
  const broken = "<!--EndFragment-->a<!--StartFragment-->";

  assert.equal(extractClipboardFragment(broken), broken);
});

test("recognizes the editor's highlight colour in every CSS spelling", () => {
  assert.equal(isHighlightColor(HIGHLIGHT_COLOR), true);
  assert.equal(isHighlightColor("#FEF08A"), true);
  assert.equal(isHighlightColor("rgb(254, 240, 138)"), true);
  assert.equal(isHighlightColor("rgb(254 240 138)"), true);
  assert.equal(isHighlightColor("rgba(254, 240, 138, 1)"), true);
});

test("does not treat a page background as a highlight", () => {
  // The source of the bug: the white behind ordinary copied text.
  assert.equal(isHighlightColor("rgb(255, 255, 255)"), false);
  assert.equal(isHighlightColor("#ffffff"), false);
  assert.equal(isHighlightColor("rgb(0, 0, 0)"), false);
  assert.equal(isHighlightColor("transparent"), false);
  assert.equal(isHighlightColor("rgba(254, 240, 138, 0)"), false);
  assert.equal(isHighlightColor(""), false);
});
