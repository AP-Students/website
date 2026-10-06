import type { Unit, UnitFRQ } from "@/types/firestore";

/**
 * A visitor cannot read an unpublished FRQ's document — it holds the prompt and
 * the rubric — so the subject page used to have no way to show that one
 * exists, and a unit full of unpublished FRQs looked empty. Each unit on the
 * subject document therefore carries a title-only listing of its FRQs, the way
 * it already carries its chapters and tests, and every FRQ write keeps that
 * listing in step.
 */

type FrqListingSource = {
  id: string;
  title?: string;
  isPublic?: boolean;
};

// Firestore rejects `undefined`, so an untitled FRQ is stored as "" — which the
// subject page already renders as "Unit N FRQ".
export const toFrqListingEntry = ({
  id,
  title,
  isPublic,
}: FrqListingSource): UnitFRQ => ({
  id,
  title: title ?? "",
  isPublic: isPublic === true,
});

/**
 * Puts one FRQ's entry into its unit's listing, replacing the old entry in
 * place, or removes it when `entry` is null. Returns null when the unit is not
 * on the subject document yet (added in the admin page but never saved): there
 * is no listing to update until Save writes the unit, and Save rebuilds it.
 */
export const patchUnitFrqListing = (
  units: Unit[],
  unitId: string,
  frqId: string,
  entry: UnitFRQ | null,
): Unit[] | null => {
  if (!units.some((unit) => unit.id === unitId)) {
    return null;
  }

  return units.map((unit) => {
    if (unit.id !== unitId) {
      return unit;
    }

    const listing = unit.frqs ?? [];

    if (!entry) {
      return { ...unit, frqs: listing.filter((frq) => frq.id !== frqId) };
    }

    return {
      ...unit,
      frqs: listing.some((frq) => frq.id === frqId)
        ? listing.map((frq) => (frq.id === frqId ? entry : frq))
        : [...listing, entry],
    };
  });
};

/**
 * Rebuilds every unit's listing from the FRQs the admin page loaded. Save
 * rewrites the whole subject document, so it has to carry the listing itself,
 * and rebuilding is also what fills the listing in for FRQs created before it
 * existed.
 */
export const withFrqListings = (
  units: Unit[],
  frqs: (Partial<FrqListingSource> & { unitId: string })[],
): Unit[] =>
  units.map((unit) => ({
    ...unit,
    frqs: frqs
      // A template without an id has no document for the listing to point at.
      .filter(
        (frq): frq is FrqListingSource & { unitId: string } =>
          frq.unitId === unit.id && Boolean(frq.id),
      )
      .map(toFrqListingEntry),
  }));

const compareById = (a: UnitFRQ, b: UnitFRQ) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/**
 * What a visitor sees for one unit. The published-FRQ query stays the authority
 * on what can be opened: a listing entry the query did not return is shown as
 * unpublished even if the listing says otherwise, so a stale listing can only
 * ever leave an FRQ behind "Work In Progress", never link to one the rules will
 * refuse. Sorted by id, which is the order Firestore returns the full
 * collection in, so visitors and staff see the same order.
 */
export const mergeVisitorFrqs = (
  publicFrqs: UnitFRQ[],
  listing: UnitFRQ[] = [],
): UnitFRQ[] => {
  const publicIds = new Set(publicFrqs.map((frq) => frq.id));

  const unpublished = listing
    .filter((entry) => !publicIds.has(entry.id))
    .map((entry) => ({ ...toFrqListingEntry(entry), isPublic: false }));

  return [...publicFrqs, ...unpublished].sort(compareById);
};
