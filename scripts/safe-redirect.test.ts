import assert from "node:assert/strict";
import { test } from "node:test";
import { getAuthHref, getSafeRedirectPath } from "../src/lib/redirect.ts";

test("a path on this site is kept, with its query and hash", () => {
  const frqPath = "/subject/precalculus/unit-1-3zxlgH1d/frq/mfr8Ab3C";

  assert.equal(getSafeRedirectPath(frqPath), frqPath);
  assert.equal(getSafeRedirectPath("/a/b?x=1#part-2"), "/a/b?x=1#part-2");
});

test("no redirect means the caller falls back to its default", () => {
  assert.equal(getSafeRedirectPath(null), null);
  assert.equal(getSafeRedirectPath(undefined), null);
  assert.equal(getSafeRedirectPath(""), null);
});

test("anything that would leave the site is refused", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "//evil.example/subject",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "javascript:alert(1)",
    "evil.example",
  ]) {
    assert.equal(getSafeRedirectPath(value), null, JSON.stringify(value));
  }
});

test("an encoded double slash stays a path on this site", () => {
  assert.equal(
    getSafeRedirectPath("/%2F%2Fevil.example"),
    "/%2F%2Fevil.example",
  );
});

test("a sign-in link carries the page to come back to", () => {
  const frqPath = "/subject/precalculus/unit-1-3zxlgH1d/frq/mfr8Ab3C";

  assert.equal(
    getAuthHref("/login", frqPath),
    `/login?redirect=${encodeURIComponent(frqPath)}`,
  );
  assert.equal(
    getAuthHref("/signup", "/library?tab=2"),
    "/signup?redirect=%2Flibrary%3Ftab%3D2",
  );
});

test("a sign-in link skips the homepage, sign-in pages and unsafe targets", () => {
  for (const returnTo of [
    null,
    "/",
    "/?ref=nav",
    "/login",
    "/login/reset",
    "/signup?redirect=%2Flibrary",
    "//evil.example",
    "https://evil.example/subject",
  ]) {
    assert.equal(getAuthHref("/login", returnTo), "/login", String(returnTo));
  }

  // Only the sign-in pages themselves are skipped, not lookalike paths.
  assert.equal(
    getAuthHref("/login", "/loginhelp"),
    "/login?redirect=%2Floginhelp",
  );
});
