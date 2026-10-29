import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { readInProgressItem } from "@/lib/dashboard/inProgress";
import {
  backupKey,
  createDraftAutosave,
  frqDraftDocument,
  frqDraftId,
  frqPathContext,
  readBackup,
  startingDraft,
  writeBackup,
  type DraftAutosave,
  type Responses,
} from "@/lib/dashboard/frqDraft";
import { dashboardDocumentPaths } from "@/types/dashboard";
import type { FRQTemplate } from "@/types/frq";

interface LoadedDraft {
  responses: Responses;
  /** When the saved draft was started, kept across visits. */
  startedAt: Timestamp | null;
  /**
   * False when the saved draft couldn't be read: saving to the server could
   * then overwrite a newer draft from another device. The browser's copy is
   * still kept.
   */
  saveToServer: boolean;
}

const readLocal = (key: string) => {
  try {
    return readBackup(window.localStorage.getItem(key));
  } catch {
    return null;
  }
};

/**
 * A student's draft of an FRQ: loads it, keeps it saved while they write,
 * and clears it once they submit.
 *
 * `uid` is undefined while sign-in is still loading, and null when no one is
 * signed in, in which case nothing is saved. `loaded` is undefined until the
 * draft is ready to start from. Call `noteEdit()` when the student changes an
 * answer: only edits are copied to the browser, so a draft still loading can
 * never overwrite the backup.
 */
export function useFrqDraft(
  template: FRQTemplate | null,
  uid: string | null | undefined,
  responses: Responses,
) {
  const [loaded, setLoaded] = useState<LoadedDraft>();
  const latest = useRef(responses);
  useEffect(() => {
    latest.current = responses;
  }, [responses]);
  const edited = useRef(false);
  const finished = useRef(false);
  const autosave = useRef<DraftAutosave | null>(null);

  const templateId = template?.id;
  const subject = template?.subject;
  const unitId = template?.unitId;
  const title = template?.title ?? "";
  const key = templateId && uid ? backupKey(templateId, uid) : "";
  const draftPath =
    templateId && subject && unitId && uid
      ? dashboardDocumentPaths.inProgress(
          uid,
          frqDraftId({ subject, unitId, templateId }),
        )
      : "";

  useEffect(() => {
    setLoaded(undefined);
    edited.current = false;
    finished.current = false;
    if (uid === undefined) return;
    if (!draftPath || !key) {
      setLoaded({ responses: {}, startedAt: null, saveToServer: false });
      return;
    }

    let cancelled = false;
    const backup = readLocal(key);
    getDoc(doc(db, draftPath))
      .then((snapshot) => {
        const data = snapshot.data({ serverTimestamps: "estimate" });
        const item = data && readInProgressItem({ id: snapshot.id, data });
        const saved =
          item && "responses" in item.state
            ? {
                responses: item.state.responses,
                updatedAt: item.updatedAt.toMillis(),
              }
            : null;
        if (cancelled) return;
        setLoaded({
          responses: startingDraft(saved, backup),
          startedAt: item?.startedAt ?? null,
          saveToServer: true,
        });
      })
      .catch((error) => {
        console.error("Error loading FRQ draft:", error);
        if (cancelled) return;
        setLoaded({
          responses: backup?.responses ?? {},
          startedAt: null,
          saveToServer: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, key, draftPath]);

  // The browser's copy follows every edit, so nothing typed is lost even
  // when the server can't be reached.
  useEffect(() => {
    if (!key || !edited.current || finished.current) return;
    try {
      window.localStorage.setItem(key, writeBackup(responses, Date.now()));
    } catch {
      // A full or disabled localStorage should not interrupt the attempt.
    }
  }, [key, responses]);

  const latestTitle = useRef(title);
  useEffect(() => {
    latestTitle.current = title;
  }, [title]);

  const saveToServer = loaded?.saveToServer ?? false;
  const startedAt = loaded?.startedAt ?? null;
  useEffect(() => {
    if (!saveToServer || !draftPath) return;
    const href = window.location.pathname;
    const context = frqPathContext(href);
    if (!context) return;

    const ref = doc(db, draftPath);
    const firstStarted = startedAt ?? Timestamp.now();
    const controller = createDraftAutosave({
      read: () => latest.current,
      save: async (saved) => {
        await setDoc(ref, {
          ...frqDraftDocument({
            context,
            label: latestTitle.current,
            href,
            startedAt: firstStarted,
            responses: saved,
          }),
          updatedAt: serverTimestamp(),
        });
      },
      remove: () => deleteDoc(ref),
    });
    autosave.current = controller;
    if (finished.current) controller.finish();

    // A student who switches away or closes the tab may not come back before
    // the next tick, so what they last wrote is saved straight away.
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") controller.flush();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenHidden);
      controller.stop();
      if (autosave.current === controller) autosave.current = null;
    };
  }, [saveToServer, startedAt, draftPath]);

  return useMemo(
    () => ({
      loaded: loaded?.responses,
      noteEdit: () => {
        edited.current = true;
      },
      /** The FRQ was submitted: deletes the saved draft and the browser's copy. */
      finish: () => {
        finished.current = true;
        if (autosave.current) {
          autosave.current.finish();
        } else if (draftPath) {
          // Not saving this visit, but a draft from an earlier one would
          // otherwise stay in progress.
          deleteDoc(doc(db, draftPath)).catch((error) =>
            console.error("Error clearing FRQ draft:", error),
          );
        }
        if (key) {
          try {
            window.localStorage.removeItem(key);
          } catch {
            // Nothing to do: the submission already succeeded.
          }
        }
      },
    }),
    [loaded, key, draftPath],
  );
}
