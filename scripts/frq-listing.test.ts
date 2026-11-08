import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeVisitorFrqs,
  patchUnitFrqListing,
  rebuildUnitFrqListing,
  toFrqListingEntry,
} from "../src/lib/frq/listing.ts";
import type { Unit } from "../src/types/firestore.ts";

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  title: `Unit ${id}`,
  chapters: [],
  ...extra,
});

test("a listing entry keeps only the id, title and visibility", () => {
  const entry = toFrqListingEntry({
    id: "frq1",
    title: "FRQ #1 Set 1",
    isPublic: true,
    // Extra template fields such as the rubric must never reach the listing.
    ...({ questions: [{ rubric: "secret" }] } as object),
  });

  assert.deepEqual(entry, {
    id: "frq1",
    title: "FRQ #1 Set 1",
    isPublic: true,
  });
});

test("an untitled or never-published FRQ is stored without undefined fields", () => {
  assert.deepEqual(toFrqListingEntry({ id: "frq1" }), {
    id: "frq1",
    title: "",
    isPublic: false,
  });
});

test("patching adds an FRQ to a unit that had no listing yet", () => {
  const units = [unit("u1"), unit("u2")];
  const entry = toFrqListingEntry({ id: "frq1", title: "New" });

  const patched = patchUnitFrqListing(units, "u2", "frq1", entry);

  assert.deepEqual(patched?.[1]?.frqs, [entry]);
  // Other units are passed through untouched.
  assert.equal(patched?.[0], units[0]);
});

test("patching replaces an existing entry in place, keeping its position", () => {
  const units = [
    unit("u1", {
      frqs: [
        { id: "a", title: "A", isPublic: false },
        { id: "b", title: "B", isPublic: false },
        { id: "c", title: "C", isPublic: false },
      ],
    }),
  ];

  const patched = patchUnitFrqListing(units, "u1", "b", {
    id: "b",
    title: "B renamed",
    isPublic: true,
  });

  assert.deepEqual(patched?.[0]?.frqs, [
    { id: "a", title: "A", isPublic: false },
    { id: "b", title: "B renamed", isPublic: true },
    { id: "c", title: "C", isPublic: false },
  ]);
});

test("patching with null removes the FRQ from the listing", () => {
  const units = [
    unit("u1", {
      frqs: [
        { id: "a", title: "A", isPublic: false },
        { id: "b", title: "B", isPublic: true },
      ],
    }),
  ];

  assert.deepEqual(patchUnitFrqListing(units, "u1", "a", null)?.[0]?.frqs, [
    { id: "b", title: "B", isPublic: true },
  ]);
});

test("patching a unit that is not on the subject document yet is skipped", () => {
  assert.equal(
    patchUnitFrqListing([unit("u1")], "unsaved", "frq1", null),
    null,
  );
});

test("Save rebuilds a unit's listing from its FRQs as just re-read", () => {
  // What the page loaded earlier; another tab has renamed and published "x".
  const loaded = unit("u1", {
    frqs: [{ id: "x", title: "Old title", isPublic: false }],
  });

  const rebuilt = rebuildUnitFrqListing(
    loaded,
    [{ id: "x", title: "New title", isPublic: true }, { id: "z" }],
    [],
  );

  assert.deepEqual(rebuilt.frqs, [
    { id: "x", title: "New title", isPublic: true },
    { id: "z", title: "", isPublic: false },
  ]);
  // Nothing else about the unit changes.
  assert.equal(rebuilt.title, "Unit u1");
});

test("a unit whose FRQs could not be read keeps its stored listing", () => {
  const stored = [
    unit("u1", { frqs: [{ id: "x", title: "Stored", isPublic: true }] }),
  ];

  assert.deepEqual(
    rebuildUnitFrqListing(unit("u1", { frqs: [] }), null, stored).frqs,
    [{ id: "x", title: "Stored", isPublic: true }],
  );
  // A unit added in this session has nothing stored yet.
  assert.deepEqual(rebuildUnitFrqListing(unit("new"), null, stored).frqs, []);
});

test("a visitor sees published FRQs and the unpublished ones from the listing", () => {
  const merged = mergeVisitorFrqs(
    [{ id: "b", title: "Published", isPublic: true }],
    [
      { id: "a", title: "Draft A", isPublic: false },
      { id: "b", title: "Published", isPublic: true },
      { id: "c", title: "Draft C", isPublic: false },
    ],
  );

  assert.deepEqual(merged, [
    { id: "a", title: "Draft A", isPublic: false },
    { id: "b", title: "Published", isPublic: true },
    { id: "c", title: "Draft C", isPublic: false },
  ]);
});

test("a stale listing can never make a visitor link to an unpublished FRQ", () => {
  // The listing still says public, but the published query did not return
  // it, so the rules would refuse to open it.
  const merged = mergeVisitorFrqs(
    [],
    [{ id: "a", title: "Unpublished since", isPublic: true }],
  );

  assert.deepEqual(merged, [
    { id: "a", title: "Unpublished since", isPublic: false },
  ]);
});

test("a published FRQ missing from the listing still shows for visitors", () => {
  // FRQs published before the listing existed must not disappear.
  assert.deepEqual(
    mergeVisitorFrqs([{ id: "a", title: "Old", isPublic: true }], undefined),
    [{ id: "a", title: "Old", isPublic: true }],
  );
});

test("visitors see FRQs in the same id order Firestore gives staff", () => {
  const merged = mergeVisitorFrqs(
    [{ id: "m", isPublic: true }],
    [
      { id: "z", title: "", isPublic: false },
      { id: "B", title: "", isPublic: false },
      { id: "a", title: "", isPublic: false },
    ],
  );

  assert.deepEqual(
    merged.map((frq) => frq.id),
    ["B", "a", "m", "z"],
  );
});
