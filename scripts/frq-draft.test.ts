import assert from "node:assert/strict";
import { test } from "node:test";
import { Timestamp } from "firebase/firestore";
import { readInProgressItem } from "../src/lib/dashboard/inProgress.ts";
import {
  backupKey,
  createDraftAutosave,
  frqDraftDocument,
  frqDraftId,
  frqPathContext,
  isBlankDraft,
  readBackup,
  startingDraft,
  writeBackup,
  type Responses,
} from "../src/lib/dashboard/frqDraft.ts";
import { AUTOSAVE_EVERY_MS } from "../src/lib/dashboard/testAutosave.ts";

/**
 * A draft autosave whose clock is driven by hand, recording every write it
 * makes in order, the way Firestore would apply them.
 */
function fakeDraft(initial: Responses) {
  let responses = initial;
  const writes: ({ saved: Responses } | "removed")[] = [];
  let tick = () => undefined as void;
  let every = 0;
  const autosave = createDraftAutosave({
    read: () => responses,
    save: async (saved) => {
      writes.push({ saved });
    },
    remove: async () => {
      writes.push("removed");
    },
    schedule: (onTick, ms) => {
      tick = onTick;
      every = ms;
      return () => undefined;
    },
  });
  return {
    autosave,
    writes,
    tick: () => tick(),
    every: () => every,
    write: (partId: string, value: string) => {
      responses = { ...responses, [partId]: value };
    },
  };
}

const empty = { thesis: "", evidence: "" };

test("an FRQ draft is saved every few seconds once something is written", () => {
  const draft = fakeDraft(empty);
  assert.equal(draft.every(), AUTOSAVE_EVERY_MS);

  // Opened, or only markup so far: nothing to save yet.
  draft.tick();
  draft.write("thesis", "<p></p>");
  draft.tick();
  assert.deepEqual(draft.writes, []);

  draft.write("thesis", "<p>Slant rhyme unsettles closure.</p>");
  draft.tick();
  draft.tick();
  draft.write("thesis", "");
  draft.tick();
  assert.deepEqual(draft.writes, [
    {
      saved: {
        thesis: "<p>Slant rhyme unsettles closure.</p>",
        evidence: "",
      },
    },
    // Clearing an answer is saved too, once there was something to save.
    { saved: { thesis: "", evidence: "" } },
  ]);
});

test("submitting an FRQ clears its draft, and nothing is saved after it", () => {
  const draft = fakeDraft(empty);
  draft.write("thesis", "<p>Slant rhyme.</p>");
  draft.tick();

  draft.autosave.finish();
  draft.write("evidence", "<p>Line 4.</p>");
  draft.tick();
  draft.autosave.flush();
  draft.autosave.stop();
  draft.autosave.finish();
  assert.deepEqual(draft.writes, [
    { saved: { thesis: "<p>Slant rhyme.</p>", evidence: "" } },
    "removed",
  ]);
});

test("leaving the page saves what's left unsaved and keeps the draft", () => {
  const draft = fakeDraft(empty);
  draft.write("thesis", "<p>Slant rhyme.</p>");
  draft.autosave.stop();
  draft.tick();
  assert.deepEqual(draft.writes, [
    { saved: { thesis: "<p>Slant rhyme.</p>", evidence: "" } },
  ]);
});

test("the browser's copy reads back what was written, and older copies too", () => {
  const responses = { thesis: "<p>Slant rhyme.</p>" };
  assert.deepEqual(readBackup(writeBackup(responses, 1_700_000)), {
    responses,
    savedAt: 1_700_000,
  });

  // Before drafts reached the server, the copy was the bare answers map.
  assert.deepEqual(
    readBackup(JSON.stringify({ thesis: "<p>Old</p>", stray: 4 })),
    { responses: { thesis: "<p>Old</p>" }, savedAt: 0 },
  );

  for (const unreadable of [null, "", "not json", "[1,2]", "null", '"text"']) {
    assert.equal(readBackup(unreadable), null, String(unreadable));
  }
  assert.equal(readBackup(JSON.stringify({ responses: "x" })), null);
});

test("an FRQ opens from whichever copy is newer", () => {
  const saved = { responses: { thesis: "server" }, updatedAt: 2_000 };
  const older = { responses: { thesis: "browser" }, savedAt: 1_000 };
  const newer = { responses: { thesis: "browser" }, savedAt: 3_000 };

  assert.deepEqual(startingDraft(saved, older), { thesis: "server" });
  // The last saves didn't reach the server, e.g. while offline.
  assert.deepEqual(startingDraft(saved, newer), { thesis: "browser" });
  assert.deepEqual(startingDraft(null, older), { thesis: "browser" });
  assert.deepEqual(startingDraft(saved, null), { thesis: "server" });
  assert.deepEqual(startingDraft(null, null), {});
  // A copy from before drafts reached the server loses to a saved draft.
  assert.deepEqual(
    startingDraft(saved, { responses: { thesis: "legacy" }, savedAt: 0 }),
    { thesis: "server" },
  );
});

test("a draft counts as blank until an answer has real text", () => {
  assert.equal(isBlankDraft({}), true);
  assert.equal(isBlankDraft({ a: "", b: "<p><br></p>" }), true);
  assert.equal(isBlankDraft({ a: "", b: "<p>x</p>" }), false);
});

test("what the draft saves is what the dashboard lists", () => {
  const path = "/subject/english-literature/unit-3-x9k2/frq/essay-1";
  const context = frqPathContext(path);
  assert.deepEqual(context, {
    subject: "english-literature",
    unitId: "unit-3",
    refId: "essay-1",
  });
  assert.ok(context);
  const startedAt = Timestamp.fromDate(new Date("2026-10-20T16:00:00Z"));
  const updatedAt = Timestamp.fromDate(new Date("2026-10-20T16:12:00Z"));
  const saved = frqDraftDocument({
    context,
    label: "  Argument Essay ",
    href: path,
    startedAt,
    responses: { thesis: "<p>Slant rhyme.</p>" },
  });

  assert.deepEqual(
    readInProgressItem({ id: "draft", data: { ...saved, updatedAt } }),
    {
      id: "draft",
      kind: "frq",
      subject: "english-literature",
      unitId: "unit-3",
      refId: "essay-1",
      label: "Argument Essay",
      href: path,
      startedAt,
      updatedAt,
      state: { responses: { thesis: "<p>Slant rhyme.</p>" } },
    },
  );
});

test("only FRQ pages have a draft listing", () => {
  for (const path of [
    "/subject/biology/unit-1-xgxskm69/chapter/0kvtm3P4/water",
    "/subject/biology/unit-1-xgxskm69/test/abc",
    "/admin/subject/biology/xgxskm69/frq/abc",
    "/subject/biology",
  ]) {
    assert.equal(frqPathContext(path), null, path);
  }
});

test("FRQs with the same id in different units never share a draft", () => {
  const ids = [
    frqDraftId({ subject: "english", unitId: "u1", templateId: "essay" }),
    frqDraftId({ subject: "english", unitId: "u2", templateId: "essay" }),
    frqDraftId({ subject: "history", unitId: "u1", templateId: "essay" }),
  ];
  assert.equal(new Set(ids).size, 3);
  for (const id of ids) {
    assert.ok(id.startsWith("frq_"));
    assert.ok(!id.includes("/"));
  }
  // The browser's copy keeps the key it always had, so older copies are found.
  assert.equal(backupKey("essay", "ada"), "frq-draft:essay:ada");
});
