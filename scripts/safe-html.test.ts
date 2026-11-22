import assert from "node:assert/strict";
import { test } from "node:test";
import {
  escapeHtml,
  oneOf,
  safeUrl,
  sanitizeInlineHtml,
} from "../src/components/article-creator/safeHtml.ts";

test("the editor's own formatting comes through unchanged", () => {
  const stored =
    "Some <b>bold</b>, <strong>strong</strong>, <i>it</i>, <em>em</em>, <s>old</s>, " +
    '<u class="cdx-underline">under</u>, <mark class="cdx-marker">marked</mark>, ' +
    '<code class="inline-code">x = 1</code>, ' +
    '<a href="https://example.com/?a=1&amp;b=2">a link</a><br>' +
    "H<sub>2</sub>O and x<sup>2</sup>, a &lt; b &amp;&amp; c &gt; d&nbsp;!";
  assert.equal(sanitizeInlineHtml(stored), stored);
});

test("text a writer typed that looks like HTML stays text", () => {
  const typed = 'see &lt;img src=x onerror="alert(1)"&gt; and &lt;script&gt;';
  assert.equal(sanitizeInlineHtml(typed), typed);
});

test("real tags that aren't inline formatting are shown as text", () => {
  for (const html of [
    "<img src=x onerror=alert(1)>",
    "<script>alert(1)</script>",
    '<iframe src="https://evil.example"></iframe>',
    "<svg onload=alert(1)>",
    "<style>body{display:none}</style>",
    '<div onclick="alert(1)">x</div>',
  ]) {
    const out = sanitizeInlineHtml(html);
    assert.ok(!/<(img|script|iframe|svg|style|div)/i.test(out), out);
  }
  assert.equal(
    sanitizeInlineHtml("<img src=x onerror=alert(1)>"),
    "&lt;img src=x onerror=alert(1)&gt;",
  );
});

test("attributes other than the few allowed ones are dropped", () => {
  assert.equal(
    sanitizeInlineHtml('<b onclick="alert(1)" style="color:red">x</b>'),
    "<b>x</b>",
  );
  assert.equal(
    sanitizeInlineHtml(
      '<a href="https://ok.example" onmouseover="alert(1)">x</a>',
    ),
    '<a href="https://ok.example">x</a>',
  );
  assert.equal(
    sanitizeInlineHtml('<span class="x" id="y" data-z="1">x</span>'),
    '<span class="x">x</span>',
  );
});

test("links can't run script, however the scheme is disguised", () => {
  for (const href of [
    "javascript:alert(1)",
    "  JavaScript:alert(1)",
    "jav&#x61;script:alert(1)",
    "&#106;avascript:alert(1)",
    "java\tscript:alert(1)",
    "java&#x09;script:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
  ]) {
    assert.equal(
      sanitizeInlineHtml(`<a href="${href}">x</a>`),
      "<a>x</a>",
      href,
    );
  }
});

test("safe links are kept, and target=_blank gets rel=noopener", () => {
  assert.equal(
    sanitizeInlineHtml('<a href="mailto:help@example.com">mail</a>'),
    '<a href="mailto:help@example.com">mail</a>',
  );
  assert.equal(
    sanitizeInlineHtml('<a href="/subject/physics">rel</a>'),
    '<a href="/subject/physics">rel</a>',
  );
  assert.equal(
    sanitizeInlineHtml('<a href="https://x.example" target="_blank">x</a>'),
    '<a href="https://x.example" target="_blank" rel="noopener noreferrer">x</a>',
  );
});

test("attribute values can't break out of their quotes", () => {
  assert.equal(
    sanitizeInlineHtml(
      `<a href='https://x.example/"onmouseover="alert(1)'>x</a>`,
    ),
    '<a href="https://x.example/&quot;onmouseover=&quot;alert(1)">x</a>',
  );
  assert.equal(
    sanitizeInlineHtml('<mark class="x&quot; onclick=&quot;alert(1)">x</mark>'),
    "<mark>x</mark>",
  );
});

test("stray brackets, comments and unclosed tags become text", () => {
  assert.equal(sanitizeInlineHtml("a < b"), "a &lt; b");
  // Escaping the "<" is enough: without it there is no comment, just text.
  assert.equal(sanitizeInlineHtml("<!-- hi -->"), "&lt;!-- hi -->");
  assert.equal(
    sanitizeInlineHtml("<img src=x onerror=alert(1)"),
    "&lt;img src=x onerror=alert(1)",
  );
  assert.equal(sanitizeInlineHtml("<B>Bold</B><br/>"), "<b>Bold</b><br>");
});

test("anything that isn't a string becomes nothing", () => {
  assert.equal(sanitizeInlineHtml(undefined), "");
  assert.equal(sanitizeInlineHtml(42), "");
  assert.equal(sanitizeInlineHtml({ html: "<b>x</b>" }), "");
});

test("huge malformed input doesn't hang", () => {
  const nasty = [
    "<a" + " x".repeat(50_000),
    "<a" + " ".repeat(100_000) + "x",
    "<".repeat(100_000),
    '<a href="' + "x".repeat(100_000),
  ];
  for (const html of nasty) {
    const started = Date.now();
    sanitizeInlineHtml(html);
    assert.ok(Date.now() - started < 1000, `${html.slice(0, 10)}...`);
  }
});

test("safeUrl allows web and relative URLs and escapes them", () => {
  assert.equal(
    safeUrl("https://img.example/a.png?x=1&amp;y=2"),
    "https://img.example/a.png?x=1&amp;y=2",
  );
  assert.equal(safeUrl("/images/a.png"), "/images/a.png");
  assert.equal(
    safeUrl('https://x.example/"><script>'),
    "https://x.example/&quot;&gt;&lt;script&gt;",
  );
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("mailto:a@b.example"), null);
  assert.equal(
    safeUrl("mailto:a@b.example", { mailto: true }),
    "mailto:a@b.example",
  );
  // Embeds must be full http(s) URLs.
  assert.equal(safeUrl("/relative", { relative: false }), null);
  assert.equal(
    safeUrl("https://www.youtube.com/embed/x", { relative: false }),
    "https://www.youtube.com/embed/x",
  );
  assert.equal(safeUrl(""), null);
  assert.equal(safeUrl(undefined), null);
});

test("escapeHtml and oneOf", () => {
  assert.equal(
    escapeHtml(`<a href="x">'&'</a>`),
    "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
  );
  assert.equal(oneOf("info", ["info", "danger"] as const, "info"), "info");
  assert.equal(
    oneOf('info" onclick="x', ["info", "danger"] as const, "info"),
    "info",
  );
});
