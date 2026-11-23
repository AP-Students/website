import assert from "node:assert/strict";
import { test } from "node:test";
import { chapterIndex, listingFor } from "./backfill-in-progress-readings.mjs";
import { chapterListing } from "../src/lib/dashboard/inProgress.ts";

const subjects = [
  [
    "chemistry",
    {
      units: [
        {
          id: "a52k2FTo",
          chapters: [{ id: "c1", title: "Moles and Molar Mass" }],
        },
        {
          id: "bg8w1y9N",
          chapters: [{ id: "c2", title: "Types of Chemical Bonds" }],
        },
      ],
    },
  ],
  [
    "art",
    {
      hasUnit0: true,
      units: [{ id: "u0", chapters: [{ id: "c3", title: "Intro" }] }],
    },
  ],
];
const index = chapterIndex(subjects);

test("an old in-progress chapter gets the listing the tracker would save", () => {
  const result = listingFor(index, "c2", { progress: "Practicing" });
  const href =
    "/subject/chemistry/unit-2-bg8w1y9N/chapter/c2/types-of-chemical-bonds";
  assert.deepEqual(result, {
    listing: {
      subject: "chemistry",
      unitId: "unit-2",
      label: "Types of Chemical Bonds",
      href,
    },
  });
  // The same fields the progress tracker writes when the chapter is opened.
  assert.deepEqual(
    result?.listing,
    chapterListing(href, "Types of Chemical Bonds"),
  );
});

test("unit numbers follow the subject's unit 0 setting", () => {
  assert.equal(
    listingFor(index, "c3", { progress: "Reading" })?.listing?.unitId,
    "unit-0",
  );
});

test("chapters already listed, finished or not started are left alone", () => {
  assert.equal(
    listingFor(index, "c1", { progress: "Reading", href: "/subject/x" }),
    null,
  );
  assert.equal(listingFor(index, "c1", { progress: "Complete" }), null);
  assert.equal(listingFor(index, "c1", { progress: "Not Started" }), null);
  assert.equal(listingFor(index, "c1", {}), null);
});

test("a chapter no subject lists is reported, not guessed", () => {
  assert.deepEqual(listingFor(index, "gone", { progress: "Need Review" }), {
    skip: "chapter not found in any subject",
  });
});
