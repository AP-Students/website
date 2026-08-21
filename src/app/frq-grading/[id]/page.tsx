"use client";

import FRQGradingRenderer from "@/components/frq/gradingRenderer";
import { useUser } from "@/components/hooks/UserContext";
import {
  getFrqTemplateDocRef,
  getUngradedFrqDocRef,
} from "@/lib/firestore/frqRefs";
import { normalizeFrqTemplate } from "@/lib/frq/template";
import type { FRQTemplate, GradableFRQSubmission } from "@/types/frq";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

type PageProps = {
  params: {
    id: string;
  };
};

const Page = ({ params }: PageProps) => {
  const { user, loading: userLoading } = useUser();

  const [submission, setSubmission] = useState<GradableFRQSubmission | null>(
    null,
  );
  const [template, setTemplate] = useState<FRQTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canGrade = user?.access === "admin" || user?.access === "grader";

  useEffect(() => {
    if (userLoading || !canGrade) {
      if (!userLoading) {
        setIsLoading(false);
      }
      return;
    }

    const fetchSubmissionAndTemplate = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const submissionSnapshot = await getDoc(
          getUngradedFrqDocRef(params.id),
        );

        if (!submissionSnapshot.exists()) {
          setLoadError(
            "This submission is no longer in the queue. It may already have been graded.",
          );
          return;
        }

        const loadedSubmission = {
          id: submissionSnapshot.id,
          ...(submissionSnapshot.data() as Omit<GradableFRQSubmission, "id">),
        };

        setSubmission(loadedSubmission);

        // The rubric being graded against lives on the template, not on the
        // submission, so both have to be in hand before grading can start.
        const templateSnapshot = await getDoc(
          getFrqTemplateDocRef(
            loadedSubmission.subject,
            loadedSubmission.unitId,
            loadedSubmission.templateId,
          ),
        );

        setTemplate(
          templateSnapshot.exists()
            ? normalizeFrqTemplate(templateSnapshot.data(), {
                id: templateSnapshot.id,
                subject: loadedSubmission.subject,
                unitId: loadedSubmission.unitId,
              })
            : null,
        );
      } catch (error) {
        console.error("Error loading FRQ submission:", error);

        setLoadError(
          error instanceof Error
            ? `Could not load this submission: ${error.message}`
            : "Could not load this submission.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSubmissionAndTemplate();
  }, [params.id, userLoading, canGrade]);

  if (userLoading || isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!canGrade) {
    return (
      <div className="p-8">
        You need grader or admin access to grade FRQ submissions.
      </div>
    );
  }

  if (loadError) {
    return <div className="p-8">{loadError}</div>;
  }

  return <FRQGradingRenderer submission={submission} template={template} />;
};

export default Page;
