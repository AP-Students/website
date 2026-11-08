import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HIGHLIGHT_COLOR,
  extractClipboardFragment,
  isBoldFontWeight,
  isHighlightColor,
  normalizePastedHtml,
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

/** The wrapper Google Docs puts around every copy, bold or not (#440). */
const docsWrapperWeight = "normal";

test("does not read Google Docs' copy wrapper as bold", () => {
  // `<b style="font-weight:normal;" id="docs-internal-guid-…">` wraps every
  // copy from Docs. Read as bold, the whole paste came out bold.
  assert.equal(isBoldFontWeight(docsWrapperWeight), false);
  assert.equal(isBoldFontWeight("400"), false);
  assert.equal(isBoldFontWeight("500"), false);
  assert.equal(isBoldFontWeight(" Normal "), false);
});

test("reads real bold weights as bold", () => {
  // Docs marks its actual bold text on spans with `font-weight:700`.
  assert.equal(isBoldFontWeight("700"), true);
  assert.equal(isBoldFontWeight("600"), true);
  assert.equal(isBoldFontWeight("bold"), true);
  assert.equal(isBoldFontWeight("BOLDER"), true);
});

test("treats a missing or unparseable weight as not bold", () => {
  assert.equal(isBoldFontWeight(""), false);
  assert.equal(isBoldFontWeight("inherit"), false);
  assert.equal(isBoldFontWeight("lighter"), false);
});

test("pasted HTML loses the Windows wrapper's line breaks even without a DOM", () => {
  // The caption showed each of these CRLF pairs as a stray space (#440).
  const windowsHtml = `<html>\r\n<body>\r\n<!--StartFragment-->${copiedSpan}<!--EndFragment-->\r\n</body>\r\n</html>`;

  assert.equal(normalizePastedHtml(windowsHtml), copiedSpan);
  assert.doesNotMatch(normalizePastedHtml(windowsHtml), /[\r\n]/);
});
