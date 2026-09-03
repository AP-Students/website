"use client";

import usePathname from "@/components/client/pathname";
import FRQFeedbackRenderer from "@/components/frq/feedbackRenderer";
import type { FRQFeedbackDocument } from "@/components/frq/feedback/types";
import {
  getFrqTemplateDocRef,
  getGradedFrqDocRef,
  getSelfGradedFrqDocRef,
} from "@/lib/firestore/frqRefs";
import { buildFeedbackDocument } from "@/lib/frq/feedbackDocument";
import { normalizeFrqTemplate } from "@/lib/frq/template";
import type { GradedFRQSubmission } from "@/types/frq";
import { getDoc, type DocumentReference } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * An ownership-scoped rule denies a read of a document that is missing *or*
 * belonging to someone else, and the client cannot tell the two apart. Both
 * mean "no result here" to this page, so both resolve to null — which is also
 * what stops the page from confirming that another student's grade exists.
 *
 * Returning rather than throwing is what lets the caller try the next
 * collection: a self-assessment has no document in `graded-frqs` at all, so
 * looking there for one is expected to come back empty.
 */
const readResultIfReadable = async (reference: DocumentReference) => {
  try {
    const snapshot = await getDoc(reference);

    return snapshot.exists() ? snapshot : null;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "permission-denied"
    ) {
      return null;
    }

    throw error;
  }
};

const Page = () => {
  const pathname = usePathname() ?? "";
  const frqId = pathname.split("/").at(-1) ?? "";

  const [feedbackData, setFeedbackData] = useState<FRQFeedbackDocument | null>(
    null,
  );
  const [overallFeedback, setOverallFeedback] = useState("");
  const [storedScore, setStoredScore] = useState("");
  const [hasPerPartGrades, setHasPerPartGrades] = useState(true);
  const [isSelfGraded, setIsSelfGraded] = useState(false);
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
        // An official result wins: a self-assessment is only shown when there
        // is no grader's verdict to show in its place.
        const officialSnapshot = await readResultIfReadable(
          getGradedFrqDocRef(frqId),
        );

        const gradedSnapshot =
          officialSnapshot ??
          (await readResultIfReadable(getSelfGradedFrqDocRef(frqId)));

        if (!gradedSnapshot) {
          setLoadError("Feedback not found.");
          return;
        }

        setIsSelfGraded(officialSnapshot === null);

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
      {/* Separate storage is only half of keeping the two apart — without this
          a self-assessment reads exactly like a grader's verdict on the page
          that shows it. */}
      {isSelfGraded && (
        <div className="border-b border-blue-400 bg-blue-50 px-8 py-3 text-sm">
          This is your own <strong>self-assessment</strong>, not an official
          FiveHive grade. You scored your responses against the rubric yourself.
        </div>
      )}

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
