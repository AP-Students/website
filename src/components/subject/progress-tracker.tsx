"use client";
import {
  cancelXpReport,
  reportWithRetry,
} from "@/lib/gamification/notifyActivityFailure";
import { reportReadingComplete } from "@/lib/gamification/reportActivity";
import { BookOpen, Check, ChevronsRight, History, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

import ConfettiExplosion from "react-confetti-explosion";
import { useUser } from "../hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { UserChapterData } from "@/types/user";
import {
  chapterListing,
  isInProgressReadingStatus,
} from "@/lib/dashboard/inProgress";

const dropdownIcons: Record<string, React.ReactNode> = {
  Reading: <BookOpen className="size-5 stroke-yellow-500" />,
  Practicing: <Pencil className="size-5 stroke-orange-500" />,
  Complete: <Check className="size-5 stroke-green-500" />,
  "Need Review": <History className="size-5 stroke-red-500" />,
  Skipped: <ChevronsRight className="size-5 stroke-blue-500" />,
};

const dropdownLabels: string[] = [
  "Not Started",
  "Reading",
  "Practicing",
  "Complete",
  "Need Review",
  "Skipped",
];

/**
 * Saves what lets the dashboard list a chapter, newest first, and link back to
 * it. Written apart from progress: if this fails, the student loses the
 * listing, never their progress.
 */
function saveChapterListing(uid: string, chapterId: string, title: string) {
  setDoc(
    doc(db, `users/${uid}/chapterData/${chapterId}`),
    {
      ...chapterListing(window.location.pathname, title),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch((error) => console.error("Error saving chapter details:", error));
}

export default function ProgressTracker({
  subject,
  unitId,
  chapterId,
  title,
}: {
  subject: string;
  unitId: string;
  chapterId: string;
  /** The chapter's title, saved with its progress for the dashboard. */
  title: string;
}) {
  const { user } = useUser();
  // The effect below keys on the id, not the user object: a context refresh
  // that hands back the same student must not re-run recovery.
  const uid = user?.uid;

  // A failed-save toast must not outlive its chapter: its Retry would act on
  // stale state.
  useEffect(() => {
    return () => {
      cancelXpReport(`xp-reading-${chapterId}`);
    };
  }, [chapterId]);

  useEffect(() => {
    let cancelled = false;
    const fetchProgress = async () => {
      if (!uid) return;

      try {
        const chapterDataRef = doc(
          db,
          `users/${uid}/chapterData/${chapterId}`,
        );
        const chapterData = await getDoc(chapterDataRef);
        // The student left this chapter while the read was pending.
        if (cancelled) return;
        const data = chapterData.data() as UserChapterData | undefined;
        setProgress(data?.progress ?? "Not Started");
        // A chapter marked before its title and link were saved can't be
        // listed on the dashboard. Opening it saves them.
        if (
          isInProgressReadingStatus(data?.progress) &&
          !data.href &&
          chapterListing(window.location.pathname, title)
        ) {
          saveChapterListing(uid, chapterId, title);
        }
        // Complete without an XP receipt means an earlier XP save failed and
        // its Retry toast is gone. The server never counts a reading twice,
        // so sending it again is safe.
        if (data?.progress === "Complete" && !data.readingXpAwarded) {
          reportWithRetry(
            () => reportReadingComplete({ subject, unitId, chapterId }),
            "Error recording completed reading:",
            `xp-reading-${chapterId}`,
            uid,
          );
        }
      } catch (error) {
        console.error("Error fetching chapter progress:", error);
      }
    };

    void fetchProgress();
    return () => {
      cancelled = true;
    };
  }, [uid, subject, unitId, chapterId, title]);

  const [progress, setProgress] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);

  const updateProgress = async (newProgress: string) => {
    if (!user) return;

    try {
      // Progress is the student's own record, so it is saved first. The XP
      // is reported afterwards, in the background: a failure there must never
      // cost the student their progress.
      await setDoc(
        doc(db, `users/${user.uid}/chapterData/${chapterId}`),
        { progress: newProgress },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating chapter progress:", error);
      alert("Failed to update chapter progress:\n" + String(error));
      return;
    }
    saveChapterListing(user.uid, chapterId, title);

    // A pending XP report for an earlier choice must not outlive this one.
    cancelXpReport(`xp-reading-${chapterId}`);
    if (newProgress === "Complete" && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 2200);
    }
    setProgress(newProgress);

    if (newProgress === "Complete") {
      reportWithRetry(
        () => reportReadingComplete({ subject, unitId, chapterId }),
        "Error recording completed reading:",
        `xp-reading-${chapterId}`,
        user.uid,
      );
    }
  };

  if (!user) {
    return (
      <Button disabled variant={"outline"}>
        Log in to track progress
      </Button>
    );
  }

  return (
    <>
      {showConfetti && <ConfettiExplosion />}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "text-md gap-1",
          )}
        >
          {dropdownIcons[progress]} {progress}
        </DropdownMenuTrigger>
        <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
          {dropdownLabels.map((value, index) => (
            <DropdownMenuItem key={index} onClick={() => updateProgress(value)}>
              {dropdownIcons[value]}
              {value}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
