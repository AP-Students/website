import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import apClassesData from "@/components/apClasses.json";
import {
  COVERAGE_COLLECTION,
  COVERAGE_DOC_ID,
  GRADING_ROLES,
  coveredSubjects,
} from "@/lib/gradingCoverage";

// The subjects students can submit FRQs for.
export const FRQ_SUBJECTS: readonly string[] = apClassesData.apClasses;

export const getCoverageDocRef = () =>
  doc(db, COVERAGE_COLLECTION, COVERAGE_DOC_ID);

// Works the list out again from everyone's user doc rather than adding or
// removing one subject, so it also fixes a list that got out of step.
//
// Only updates the list if filtering is already on, unless `turnOn` is set:
// saving the first few people's subjects shouldn't hide every other subject
// from students before an admin has filled in the rest.
export async function refreshGradingCoverage({ turnOn = false } = {}): Promise<
  string[] | null
> {
  const staff = await getDocs(
    query(collection(db, "users"), where("access", "in", [...GRADING_ROLES])),
  );
  const subjects = coveredSubjects(
    FRQ_SUBJECTS,
    staff.docs.map((user) => ({ uid: user.id, ...user.data() })),
  );
  return runTransaction(db, async (transaction) => {
    const current = await transaction.get(getCoverageDocRef());
    if (!current.exists() && !turnOn) return null;
    transaction.set(getCoverageDocRef(), {
      subjects,
      updatedAt: serverTimestamp(),
    });
    return subjects;
  });
}

// Students see every subject again.
export async function turnOffGradingCoverage(): Promise<void> {
  await deleteDoc(getCoverageDocRef());
}

export async function saveGraderSubjects(
  uid: string,
  subjects: string[],
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { graderSubjectAccess: subjects });
  await refreshGradingCoverage();
}
