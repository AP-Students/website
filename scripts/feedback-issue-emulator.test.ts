import assert from "node:assert/strict";
import test from "node:test";
import { usesFirebaseEmulators } from "../src/lib/firebase-mode.js";
import { createFeedbackIssue } from "../src/lib/feedback/createIssue.ts";

function loadRoute(mode: string, flag: string | undefined) {
  return {
    POST: (req: Request) => createFeedbackIssue(req, {
      localFirebase: usesFirebaseEmulators(mode, flag),
      projectId: "hosted-test",
      credentials: {
        GITHUB_ACCESS_TOKEN: "test-token",
        GITHUB_REPO_OWNER: "test-owner",
        GITHUB_REPO_NAME: "test-repo",
      },
      fetch,
    }),
  };
}

test("emulator mode blocks issue creation even with GitHub credentials and forged admin tokens", async (t) => {
  const { POST } = await loadRoute("development", "true");
  const network = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Emulator issue creation must perform zero network requests");
  });
  for (const token of ["local-admin-token", "hosted-user-token", ""]) {
    const response = await POST(new Request("http://localhost/api/feedback/create-issue", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: JSON.stringify({ feedbackId: "local-feedback" }),
    }));
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /disabled.*emulator/);
  }
  assert.equal(network.mock.callCount(), 0);
});

test("production and ordinary development retain authorized GitHub issue creation", async (t) => {
  for (const [mode, flag] of [["production", "true"], ["development", undefined]] as const) {
    const { POST } = await loadRoute(mode, flag);
    const calls: string[] = [];
    const network = t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      if (calls.length === 1) {
        assert.equal(new Headers(init?.headers).get("authorization"), "Bearer hosted-user-token");
        return Response.json({ fields: { type: { stringValue: "bug" }, title: { stringValue: "Test report" } } });
      }
      if (calls.length === 2) {
        assert.equal(url, "https://api.github.com/repos/test-owner/test-repo/issues");
        assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-token");
        return Response.json({ html_url: "https://example.test/issues/42", number: 42 });
      }
      assert.equal(init?.method, "PATCH");
      return Response.json({});
    });
    const request = (token: string) => new Request("http://localhost/api/feedback/create-issue", {
      method: "POST", headers: { Authorization: token },
      body: JSON.stringify({ feedbackId: "feedback" }),
    });
    assert.equal((await POST(request(""))).status, 401);
    assert.equal(calls.length, 0);
    const response = await POST(request("Bearer hosted-user-token"));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).issueNumber, 42);
    assert.equal(calls.length, 3);
    assert.ok(calls[0]?.startsWith("https://firestore.googleapis.com/"));
    network.mock.restore();
  }
});
