import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { readXpProgress, type XpProgress } from "@/lib/gamification/xp";
import { dashboardDocumentPaths } from "@/types/dashboard";

export interface XpProgressState {
  /** Undefined while loading, and after a read error. */
  progress?: XpProgress;
  /**
   * Set when the stats couldn't be read. Kept separate so a failure is never
   * shown as a real "Level 1, 0 XP".
   */
  error?: Error;
}

/**
 * The signed-in student's XP total and level, kept live as the server awards
 * more. A student with no XP yet is level 1.
 */
export function useXpProgress(uid: string | undefined): XpProgressState {
  const [state, setState] = useState<XpProgressState>({});

  useEffect(() => {
    setState({});
    if (!uid) return;

    return onSnapshot(
      doc(db, dashboardDocumentPaths.stats(uid)),
      (snapshot) => setState({ progress: readXpProgress(snapshot.data()) }),
      (error) => {
        console.error("Error loading XP:", error);
        setState({ error });
      },
    );
  }, [uid]);

  return state;
}
