import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEFAULT_XP_CONFIG,
  levelForXp,
  readXpProgress,
  type XpProgress,
} from "@/lib/gamification/xp";

/**
 * The signed-in student's XP total and level, kept live as the server awards
 * more. Undefined until it has loaded; a student with no XP yet is level 1.
 */
export function useXpProgress(uid: string | undefined): XpProgress | undefined {
  const [progress, setProgress] = useState<XpProgress>();

  useEffect(() => {
    setProgress(undefined);
    if (!uid) return;

    return onSnapshot(
      doc(db, "userStats", uid),
      (snapshot) => setProgress(readXpProgress(snapshot.data())),
      (error) => {
        console.error("Error loading XP:", error);
        setProgress(levelForXp(0, DEFAULT_XP_CONFIG));
      },
    );
  }, [uid]);

  return progress;
}
