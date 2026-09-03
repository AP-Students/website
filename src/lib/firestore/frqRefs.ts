import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const getFrqTemplatesCollectionRef = (
  subjectSlug: string,
  unitId: string,
) => collection(db, "subjects", subjectSlug, "units", unitId, "frqs");

export const getFrqTemplateDocRef = (
  subjectSlug: string,
  unitId: string,
  frqId: string,
) => doc(db, "subjects", subjectSlug, "units", unitId, "frqs", frqId);

export const getUngradedFrqsCollectionRef = () =>
  collection(db, "ungraded-frqs");

export const getUngradedFrqDocRef = (submissionId: string) =>
  doc(db, "ungraded-frqs", submissionId);

export const getGradedFrqsCollectionRef = () => collection(db, "graded-frqs");

export const getGradedFrqDocRef = (submissionId: string) =>
  doc(db, "graded-frqs", submissionId);

/**
 * Self-assessments live in their own collection rather than alongside official
 * results, because the two are not the same claim: anybody may score their own
 * attempt however they like, so a self-grade carries none of the authority a
 * FiveHive grader's does. Keeping them apart means no query for official
 * results has to remember to filter self-grades back out, and the security
 * rules can let a student write one without ever loosening who may write an
 * official grade.
 */
export const getSelfGradedFrqsCollectionRef = () =>
  collection(db, "self-graded-frqs");

export const getSelfGradedFrqDocRef = (submissionId: string) =>
  doc(db, "self-graded-frqs", submissionId);
