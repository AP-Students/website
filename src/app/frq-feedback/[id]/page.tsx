"use client";

import FRQFeedbackRenderer from "@/components/frq/feedbackRenderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import usePathname from "@/components/client/pathname";

type FeedbackStatus = "loading" | "found" | "not-found";

const Page = () => {
  const pathname = usePathname() ?? "";
  const frqId = pathname.split("/").at(-1) ?? "";
  const [status, setStatus] = useState<FeedbackStatus>("loading");

  useEffect(() => {
    const fetchFeedback = async () => {
      setStatus("loading");
      try {
        const docRef = doc(db, "gradedFrqSubmissions", frqId);
        const docSnap = await getDoc(docRef);

        setStatus(docSnap.exists() ? "found" : "not-found");
      } catch (error: unknown) {
        console.error("Error fetching FRQ feedback:", error);
        setStatus("not-found");
      }
    };

    void fetchFeedback();
  }, [frqId]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "not-found") {
    return <p>Feedback not found.</p>;
  }

  return (
    <div className="px-8 py-12">
      {/*
        A real `feedbackData` cannot be built from a GradedFRQSubmission yet, so
        the renderer intentionally falls back to its mock data here.

        FRQFeedbackDocument is rubric-shaped: layout.tsx derives the displayed
        score by summing `feedback.questions[].gradingCriteria[].points` over
        `frqs[].questions[].gradingCriteria[].points`, and dropdownContent.tsx
        renders one row per criterion plus per-part feedback. A graded submission
        stores only an aggregate `score` string ("3/6") and a single `feedback`
        string, and its `templateId` resolves to an FRQTemplate that carries no
        rubric criteria and no question/part tree.

        Building a document from what is stored today would render 0/0 points
        with empty rubric rows and drop the grader's written feedback entirely --
        strictly more misleading than the fallback. Closing this needs either the
        grading write side to persist per-criterion scores and per-part feedback,
        or FRQFeedbackDocument to accept an aggregate score/feedback pair.
      */}
      <FRQFeedbackRenderer />
    </div>
  );
};

export default Page;
