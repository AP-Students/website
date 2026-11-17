import assert from "node:assert/strict";
import { test } from "node:test";
import {
  codeToHtml,
  htmlToCode,
  listItemsToHtml,
} from "../src/components/article-creator/codeConversion.ts";

/** Most blocks' sanitizers drop `<br>` when they import converted HTML. */
const withoutLineBreaks = (html: string) => html.replace(/<br\s*\/?>/gi, "");

test("a one-line paragraph becomes the same line of code", () => {
  assert.equal(htmlToCode("const answer = 42;"), "const answer = 42;");
});

test("every line break starts a new line of code", () => {
  assert.equal(
    htmlToCode("first<br>second<br/>third<BR />"),
    "first\nsecond\nthird",
  );
});

test("an empty line in the block stays an empty line", () => {
  assert.equal(htmlToCode("top<br><br>bottom"), "top\n\nbottom");
});

test("a line break at the very end adds no empty line, as in the block", () => {
  // Editors leave a trailing <br>, which the block doesn't show.
  assert.equal(htmlToCode("last line<br>"), "last line");
  // Two of them do show one empty line.
  assert.equal(htmlToCode("last line<br><br>"), "last line\n");
});

test("an empty paragraph becomes an empty code block", () => {
  assert.equal(htmlToCode(""), "");
  assert.equal(htmlToCode("<br>"), "");
});

test("typed indentation, stored as &nbsp;, becomes spaces", () => {
  // What the browser stores after four spaces are typed at the start of a line.
  assert.equal(
    htmlToCode("def f():<br>&nbsp; &nbsp; return 1"),
    "def f():\n    return 1",
  );
  assert.equal(htmlToCode("\u00a0\u00a0x = 1"), "  x = 1");
});

test("spaces the block never showed are not added", () => {
  assert.equal(htmlToCode("a\n    b"), "a b");
  assert.equal(htmlToCode("  padded  <br>  next"), "padded\nnext");
  assert.equal(htmlToCode("a <b> b</b>"), "a b");
});

test("characters that look like HTML come out as literal code", () => {
  const html =
    "&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt; if (a &amp;&amp; b) { x = 'y'; }";
  assert.equal(
    htmlToCode(html),
    `<script>alert("hi")</script> if (a && b) { x = 'y'; }`,
  );
  assert.equal(htmlToCode("&#60;&#x3E;&#39;&apos;"), "<>''");
});

test("unknown or invalid character references are left as typed", () => {
  assert.equal(
    htmlToCode("&copy; &#0; &#xFFFFFFF; &notanentity"),
    "&copy; &#0; &#xFFFFFFF; &notanentity",
  );
});

test("formatting such as bold and links is dropped and its text kept", () => {
  assert.equal(
    htmlToCode(
      '<b>bold</b>, <i>italic</i> and <a href="https://example.com/?a=1&amp;b=2">a link</a>',
    ),
    "bold, italic and a link",
  );
  assert.equal(htmlToCode('<code class="inline-code">x</code> = 1'), "x = 1");
  // An attribute value may contain ">".
  assert.equal(htmlToCode('<a title="a > b">kept</a>'), "kept");
});

test("code becomes escaped HTML, so it is shown and never applied", () => {
  assert.equal(
    codeToHtml("<b>not bold</b> & more"),
    "&lt;b&gt;not bold&lt;/b&gt; &amp; more",
  );
});

test("code lines are joined so they don't run together without line breaks", () => {
  const html = codeToHtml("first\nsecond\r\nthird");
  assert.equal(html, "first <br>second <br>third");
  assert.equal(withoutLineBreaks(html), "first second third");
});

test("unindented code survives a trip to a text block and back", () => {
  const code = `if (a < b && c > "d") {\nreturn '<b>';\n}\n\ndone()`;
  assert.equal(htmlToCode(codeToHtml(code)), code);
});

test("a list gives one line of code per item, nested items after their parent", () => {
  const items = [
    {
      content: "<b>first</b>",
      items: [{ content: "nested &amp; more", items: [] }],
    },
    { content: "second", items: [] },
    "old-style item",
  ];
  const html = listItemsToHtml(items);
  assert.equal(
    htmlToCode(html),
    "first\nnested & more\nsecond\nold-style item",
  );
});

test("other blocks still get a list's items separated by spaces", () => {
  const html = listItemsToHtml([
    { content: "one" },
    { content: "two", items: [{ content: "three" }] },
  ]);
  assert.equal(withoutLineBreaks(html), "one two three");
  assert.equal(listItemsToHtml([]), "");
});
