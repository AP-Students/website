import assert from "node:assert/strict";
import test from "node:test";
import { demoFirebaseConfig, firebaseConfigForMode, firestoreDocumentsBase, usesFirebaseEmulators } from "../src/lib/firebase-mode.js";

for (const [mode, flag, expected] of [
  ["development", "true", true],
  ["development", undefined, false],
  ["development", "false", false],
  ["production", "true", false],
] as const) {
  test(`Firebase routing for ${mode} with flag ${flag}`, () => {
    const local = usesFirebaseEmulators(mode, flag);
    assert.equal(local, expected);
    const project = "hosted-test";
    const url = new URL(firestoreDocumentsBase(project, local, {host: "127.0.0.1", port: 8080}));
    assert.equal(url.origin, expected ? "http://127.0.0.1:8080" : "https://firestore.googleapis.com");
    assert.equal(url.pathname, `/v1/projects/${expected ? "demo-aproject" : "hosted-test"}/databases/(default)/documents`);
  });
}


test("emulator mode overrides hosted SDK config even without the launcher", () => {
  const hosted = {
    projectId: "real-project", storageBucket: "real-bucket",
    apiKey: "hosted-key", authDomain: "hosted.example",
  };
  assert.deepEqual(firebaseConfigForMode(hosted, true), demoFirebaseConfig);
  assert.equal(firebaseConfigForMode(hosted, false), hosted);
});

test("development rejects a misspelled emulator flag and production ignores it", () => {
  assert.throws(() => usesFirebaseEmulators("development", "treu"), /must be true or false/);
  assert.equal(usesFirebaseEmulators("production", "treu"), false);
});
