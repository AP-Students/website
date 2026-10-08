"use client";
import { toast } from "sonner";
import { reportWithRetry } from "@/lib/gamification/notifyActivityFailure";
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
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserChapterData } from "@/types/user";

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

export default function ProgressTracker({
  subject,
  unitId,
  chapterId,
}: {
  subject: string;
  unitId: string;
  chapterId: string;
}) {
  const { user } = useUser();

  // A failed-save toast must not outlive its chapter: its Retry would act on
  // stale state.
  useEffect(() => {
    return () => {
      toast.dismiss(`xp-reading-${chapterId}`);
    };
  }, [chapterId]);

  useEffect(() => {
    let cancelled = false;
    const fetchProgress = async () => {
      if (!user) return;

      try {
        const chapterDataRef = doc(
          db,
          `users/${user.uid}/chapterData/${chapterId}`,
        );
        const chapterData = await getDoc(chapterDataRef);
        // The student left this chapter while the read was pending.
        if (cancelled) return;
        const data = chapterData.data() as UserChapterData;
        setProgress(data?.progress ?? "Not Started");
        // Complete without an XP receipt means an earlier XP save failed and
        // its Retry toast is gone. The server never counts a reading twice,
        // so sending it again is safe.
        if (data?.progress === "Complete" && !data.readingXpAwarded) {
          reportWithRetry(
            () => reportReadingComplete({ subject, unitId, chapterId }),
            "Error recording completed reading:",
            `xp-reading-${chapterId}`,
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
  }, [user, subject, unitId, chapterId]);

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

    toast.dismiss(`xp-reading-${chapterId}`);
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
