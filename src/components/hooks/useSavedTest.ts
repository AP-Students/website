import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { readInProgressItem } from "@/lib/dashboard/inProgress";
import { testSaveId, type TestSource } from "@/lib/dashboard/testAutosave";
import { dashboardDocumentPaths, type InProgressItem } from "@/types/dashboard";

export type SavedTest =
  | { status: "loading" }
  /** Nothing to pick up: no save, or no one signed in. */
  | { status: "none" }
  | { status: "found"; save: InProgressItem }
  /**
   * The save couldn't be read. The test starts over, and must not autosave:
   * that would write over a save that may still be there.
   */
  | { status: "failed" };

/**
 * The signed-in student's save for this test, if they started it before and
 * didn't submit it. Waits for sign-in to settle, so a student whose session
 * is still loading isn't taken for one with nothing saved.
 */
export function useSavedTest(source: TestSource | undefined): SavedTest {
  const [saved, setSaved] = useState<SavedTest>({ status: "loading" });
  const subject = source?.subject;
  const unitId = source?.unitId;
  const testId = source?.testId;

  useEffect(() => {
    if (!subject || !unitId || !testId) {
      setSaved({ status: "none" });
      return;
    }
    setSaved({ status: "loading" });
    let cancelled = false;
    const id = testSaveId({ subject, unitId, testId });

    // The first report says whether anyone is signed in.
    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      if (!user) {
        if (!cancelled) setSaved({ status: "none" });
        return;
      }
      getDoc(doc(db, dashboardDocumentPaths.inProgress(user.uid, id)))
        .then((snapshot) => {
          const data = snapshot.data();
          const save = data && readInProgressItem({ id: snapshot.id, data });
          if (cancelled) return;
          setSaved(
            save?.kind === "mcq_test"
              ? { status: "found", save }
              : { status: "none" },
          );
        })
        .catch((error) => {
          console.error("Error loading saved test:", error);
          if (!cancelled) setSaved({ status: "failed" });
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [subject, unitId, testId]);

  return saved;
}
