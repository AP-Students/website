"use client";

import usePathname from "@/components/client/pathname";
import FRQFeedbackRenderer from "@/components/frq/feedbackRenderer";
import type { FRQFeedbackDocument } from "@/components/frq/feedback/types";
import {
  getFrqTemplateDocRef,
  getGradedFrqDocRef,
} from "@/lib/firestore/frqRefs";
import { buildFeedbackDocument } from "@/lib/frq/feedbackDocument";
import { normalizeFrqTemplate } from "@/lib/frq/template";
import type { GradedFRQSubmission } from "@/types/frq";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname() ?? "";
  const frqId = pathname.split("/").at(-1) ?? "";

  const [feedbackData, setFeedbackData] = useState<FRQFeedbackDocument | null>(
    null,
  );
  const [overallFeedback, setOverallFeedback] = useState("");
  const [storedScore, setStoredScore] = useState("");
  const [hasPerPartGrades, setHasPerPartGrades] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      setLoadError(null);

      if (!frqId) {
        setLoadError("Feedback not found.");
        setIsLoading(false);
        return;
      }

      try {
        const gradedSnapshot = await getDoc(getGradedFrqDocRef(frqId));

        if (!gradedSnapshot.exists()) {
          setLoadError("Feedback not found.");
          return;
        }

        const graded = {
          id: gradedSnapshot.id,
          ...(gradedSnapshot.data() as Omit<GradedFRQSubmission, "id">),
        };

        // The rubric tree lives on the template. Without it there is nothing to
        // show the awarded points against, which is exactly why this page used
        // to fall back to canned AP Human Geography content.
        const templateSnapshot = await getDoc(
          getFrqTemplateDocRef(
            graded.subject,
            graded.unitId,
            graded.templateId,
          ),
        );

        if (!templateSnapshot.exists()) {
          setLoadError(
            "The FRQ this grade belongs to no longer exists, so its feedback cannot be shown.",
          );
          return;
        }

        const template = normalizeFrqTemplate(templateSnapshot.data(), {
          id: templateSnapshot.id,
          subject: graded.subject,
          unitId: graded.unitId,
        });

        setFeedbackData(buildFeedbackDocument(graded, template));
        setOverallFeedback(graded.feedback ?? "");
        setStoredScore(graded.score ?? "");
        setHasPerPartGrades(
          Array.isArray(graded.grades) && graded.grades.length > 0,
        );
      } catch (error: unknown) {
        console.error("Error fetching FRQ feedback:", error);

        // An ownership-scoped rule denies reads of a document that is missing
        // *or* belongs to someone else, and the client cannot tell which. Both
        // are reported as not-found so the page never confirms that another
        // student's grade exists.
        const isDenied =
          typeof error === "object" &&
          error !== null &&
          (error as { code?: string }).code === "permission-denied";

        if (isDenied) {
          setLoadError("Feedback not found.");
          return;
        }

        setLoadError(
          error instanceof Error
            ? `Could not load this feedback: ${error.message}`
            : "Could not load this feedback.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFeedback();
  }, [frqId]);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (loadError !== null || feedbackData === null) {
    return <div className="p-8">{loadError ?? "Feedback not found."}</div>;
  }

  return (
    <div>
      {!hasPerPartGrades && (
        <div className="border-b border-yellow-400 bg-yellow-50 px-8 py-3 text-sm">
          This submission was graded before per-question scores were recorded,
          so the rubric below shows zero for every line. The grader&apos;s
          recorded score was{" "}
          <strong>
            {storedScore.trim().length > 0 ? storedScore : "not recorded"}
          </strong>
          .
        </div>
      )}

      <FRQFeedbackRenderer
        feedbackData={feedbackData}
        readOnly
        overallFeedback={overallFeedback}
      />
    </div>
  );
};

export default Page;
