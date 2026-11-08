import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { pathContext } from "@/lib/savedItemPayload";
import {
  createTestAutosave,
  mcqTestProgress,
  testSaveId,
  type TestAutosave,
  type TestSource,
} from "@/lib/dashboard/testAutosave";
import { dashboardDocumentPaths, type McqTestState } from "@/types/dashboard";

/**
 * Saves a practice test in progress every few seconds: its answers, current
 * question and time left, read from `progress`. Call `finish()` when the test
 * is submitted; it stops saving and deletes the save. For a test picked back
 * up from a save, pass when it was first started as `resumedFrom`.
 *
 * Does nothing without a `source` (admin previews), away from a test page,
 * or while no one is signed in.
 */
export function useTestAutosave(
  source: TestSource | undefined,
  label: string,
  progress: MutableRefObject<McqTestState>,
  resumedFrom?: Timestamp,
): { finish: () => void } {
  const autosave = useRef<TestAutosave | null>(null);
  // A test can be submitted before the autosave starts: one picked back up
  // with no time left is submitted as the header mounts. Remembering that
  // keeps the autosave from bringing the save back.
  const finished = useRef(false);
  // The test's name can arrive after it opens; the next save picks it up.
  const latestLabel = useRef(label);
  useEffect(() => {
    latestLabel.current = label;
  }, [label]);

  const subject = source?.subject;
  const unitId = source?.unitId;
  const testId = source?.testId;
  useEffect(() => {
    if (!subject || !unitId || !testId) return;
    const href = window.location.pathname;
    const context = pathContext(href);
    if (!context) return;

    const id = testSaveId({ subject, unitId, testId });
    const startedAt = resumedFrom ?? Timestamp.now();
    // Looked up at each write: the student may sign in after the test opens.
    const saveRef = () => {
      const uid = auth.currentUser?.uid;
      return uid ? doc(db, dashboardDocumentPaths.inProgress(uid, id)) : null;
    };

    const controller = createTestAutosave({
      resumed: resumedFrom !== undefined,
      read: () => progress.current,
      save: async (state) => {
        const ref = saveRef();
        if (!ref) return;
        await setDoc(ref, {
          ...mcqTestProgress({
            context,
            label: latestLabel.current,
            href,
            startedAt,
            state,
          }),
          updatedAt: serverTimestamp(),
        });
      },
      remove: async () => {
        const ref = saveRef();
        if (ref) await deleteDoc(ref);
      },
    });
    autosave.current = controller;
    if (finished.current) controller.finish();

    // A student who switches away or closes the tab may not come back before
    // the next tick, so what they last did is saved straight away.
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") controller.flush();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenHidden);
      controller.stop();
      if (autosave.current === controller) autosave.current = null;
    };
  }, [subject, unitId, testId, progress, resumedFrom]);

  return useMemo(
    () => ({
      finish: () => {
        finished.current = true;
        autosave.current?.finish();
      },
    }),
    [],
  );
}
