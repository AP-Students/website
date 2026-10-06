import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GUEST_DRAFT_OWNER,
  claimGuestDraft,
  getDraftKey,
  readDraft,
  type DraftStorage,
} from "../src/lib/frq/draft.ts";

const createStorage = (
  initial: Record<string, string> = {},
  { failWrites = false } = {},
) => {
  const items = new Map(Object.entries(initial));
  const storage: DraftStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      if (failWrites) {
        throw new Error("QuotaExceededError");
      }
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };

  return { storage, items };
};

const guestKey = getDraftKey("frq1", GUEST_DRAFT_OWNER);
const userKey = getDraftKey("frq1", "uid-123");

test("drafts are keyed by FRQ and by who wrote them", () => {
  assert.equal(guestKey, "frq-draft:frq1:guest");
  assert.equal(userKey, "frq-draft:frq1:uid-123");
});

test("an unreadable draft reads as empty instead of blocking the attempt", () => {
  const { storage } = createStorage({
    corrupt: "{not json",
    list: '["a"]',
    mixed: JSON.stringify({ a: "answer", b: 4 }),
  });

  assert.deepEqual(readDraft(storage, "missing"), {});
  assert.deepEqual(readDraft(storage, "corrupt"), {});
  assert.deepEqual(readDraft(storage, "list"), {});
  assert.deepEqual(readDraft(storage, "mixed"), { a: "answer" });

  const throwing: DraftStorage = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => undefined,
    removeItem: () => undefined,
  };
  assert.deepEqual(readDraft(throwing, "any"), {});
});

test("signing in carries the signed-out answers onto the account", () => {
  const { storage, items } = createStorage({
    [guestKey]: JSON.stringify({ p1: "<p>Guest answer</p>", p2: "" }),
  });

  claimGuestDraft(storage, "frq1", "uid-123");

  assert.deepEqual(readDraft(storage, userKey), {
    p1: "<p>Guest answer</p>",
  });
  // Claimed once: the guest copy is gone.
  assert.equal(items.has(guestKey), false);
});

test("a guest answer replaces the account's older answer for the same part", () => {
  const { storage } = createStorage({
    [guestKey]: JSON.stringify({ p1: "newer", p2: "<p></p>", p3: "" }),
    [userKey]: JSON.stringify({ p1: "older", p2: "kept", p3: "also kept" }),
  });

  claimGuestDraft(storage, "frq1", "uid-123");

  assert.deepEqual(readDraft(storage, userKey), {
    p1: "newer",
    p2: "kept",
    p3: "also kept",
  });
});

test("an empty guest draft leaves the account's draft untouched", () => {
  const userDraft = JSON.stringify({ p1: "mine" });
  const { storage, items } = createStorage({
    [guestKey]: JSON.stringify({ p1: "", p2: "<p> </p>" }),
    [userKey]: userDraft,
  });

  claimGuestDraft(storage, "frq1", "uid-123");

  assert.equal(items.get(userKey), userDraft);
  assert.equal(items.has(guestKey), false);
});

test("a full localStorage keeps the guest copy so it can be claimed later", () => {
  const { storage, items } = createStorage(
    { [guestKey]: JSON.stringify({ p1: "answer" }) },
    { failWrites: true },
  );

  assert.doesNotThrow(() => claimGuestDraft(storage, "frq1", "uid-123"));
  assert.equal(items.has(guestKey), true);
  assert.equal(items.has(userKey), false);
});

test("claiming only touches the FRQ being opened", () => {
  const otherGuestKey = getDraftKey("frq2", GUEST_DRAFT_OWNER);
  const { storage, items } = createStorage({
    [otherGuestKey]: JSON.stringify({ p1: "other FRQ" }),
  });

  claimGuestDraft(storage, "frq1", "uid-123");

  assert.equal(items.has(otherGuestKey), true);
  assert.equal(items.has(userKey), false);
});
