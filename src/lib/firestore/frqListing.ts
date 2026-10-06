import { db } from "@/lib/firebase";
import { getFrqTemplatesCollectionRef } from "@/lib/firestore/frqRefs";
import { mergeVisitorFrqs, patchUnitFrqListing } from "@/lib/frq/listing";
import type { Subject, Unit, UnitFRQ } from "@/types/firestore";
import {
  doc,
  getDocs,
  query,
  runTransaction,
  where,
  type Transaction,
} from "firebase/firestore";

/**
 * Applies a write to one FRQ document and the matching change to its unit's
 * listing on the subject document in one transaction, so the listing visitors
 * read cannot drift from the FRQ it describes. `entry` is null for a delete.
 */
export const writeFrqWithListing = (
  subjectSlug: string,
  unitId: string,
  frqId: string,
  entry: UnitFRQ | null,
  writeFrq: (transaction: Transaction) => void,
) =>
  runTransaction(db, async (transaction) => {
    const subjectRef = doc(db, "subjects", subjectSlug);
    // A transaction has to do all of its reads before its first write.
    const subjectSnapshot = await transaction.get(subjectRef);

    writeFrq(transaction);

    if (!subjectSnapshot.exists()) {
      return;
    }

    const storedUnits = (subjectSnapshot.data() as Subject).units;
    const units = patchUnitFrqListing(
      Array.isArray(storedUnits) ? storedUnits : [],
      unitId,
      frqId,
      entry,
    );

    if (units) {
      transaction.update(subjectRef, { units });
    }
  });

/**
 * The FRQs one unit shows on the subject page and in its sidebar. Staff read
 * the whole collection. Everyone else gets the published FRQs, which are the
 * only ones they may open, plus the unit's listing, so an unpublished FRQ still
 * shows up as "Work In Progress" the way an unpublished chapter or test does.
 */
export const loadUnitFrqs = async (
  subjectSlug: string,
  unit: Unit,
  canPreview: boolean,
): Promise<UnitFRQ[]> => {
  const frqsCollectionRef = getFrqTemplatesCollectionRef(subjectSlug, unit.id);

  try {
    const frqsSnapshot = await getDocs(
      canPreview
        ? frqsCollectionRef
        : query(frqsCollectionRef, where("isPublic", "==", true)),
    );

    const frqs = frqsSnapshot.docs.map((frqDoc) => ({
      ...frqDoc.data(),
      id: frqDoc.id,
    }));

    return canPreview ? frqs : mergeVisitorFrqs(frqs, unit.frqs);
  } catch (frqError) {
    // FRQs are supplementary to the curriculum. A failure here — a rules
    // change that has not been deployed, an offline read — must not take down
    // the whole subject page, so the unit falls back to its listing, with
    // nothing linked because nothing was confirmed published.
    console.error(`Unable to load FRQs for unit ${unit.id}:`, frqError);

    return canPreview ? [] : mergeVisitorFrqs([], unit.frqs);
  }
};
