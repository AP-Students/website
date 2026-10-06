import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeVisitorFrqs,
  patchUnitFrqListing,
  toFrqListingEntry,
  withFrqListings,
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

  assert.deepEqual(entry, { id: "frq1", title: "FRQ #1 Set 1", isPublic: true });
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

test("Save rebuilds every unit's listing from the loaded FRQs", () => {
  const units = [
    // A stale listing from before an FRQ action wrote through.
    unit("u1", { frqs: [{ id: "old", title: "Old", isPublic: true }] }),
    unit("u2"),
    unit("u3"),
  ];

  const rebuilt = withFrqListings(units, [
    { id: "x", unitId: "u1", title: "X", isPublic: false },
    { id: "y", unitId: "u2", title: "Y", isPublic: true },
    { id: "z", unitId: "u1" },
    // An id-less template has no document to list.
    { unitId: "u2", title: "No id" },
  ]);

  assert.deepEqual(
    rebuilt.map((rebuiltUnit) => rebuiltUnit.frqs),
    [
      [
        { id: "x", title: "X", isPublic: false },
        { id: "z", title: "", isPublic: false },
      ],
      [{ id: "y", title: "Y", isPublic: true }],
      [],
    ],
  );
  // Nothing else about the unit changes.
  assert.equal(rebuilt[0]?.title, "Unit u1");
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
