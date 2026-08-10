import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const getFrqTemplatesCollectionRef = (
  subjectSlug: string,
  unitId: string,
) =>
  collection(
    db,
    "subjects",
    subjectSlug,
    "units",
    unitId,
    "frqs",
  );

export const getFrqTemplateDocRef = (
  subjectSlug: string,
  unitId: string,
  frqId: string,
) =>
  doc(
    db,
    "subjects",
    subjectSlug,
    "units",
    unitId,
    "frqs",
    frqId,
  );

export const getUngradedFrqsCollectionRef = () =>
  collection(db, "ungraded-frqs");

export const getUngradedFrqDocRef = (submissionId: string) =>
  doc(db, "ungraded-frqs", submissionId);

export const getGradedFrqsCollectionRef = () =>
  collection(db, "graded-frqs");

export const getGradedFrqDocRef = (submissionId: string) =>
  doc(db, "graded-frqs", submissionId);