"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { useUser } from "@/components/hooks/UserContext";
import FRQFooter from "@/components/frq/FRQFooter";
import { downloadResponsesAsPdf } from "@/components/frq/test/downloadResponsesPdf";
import QuestionPane, {
  getPartAnchorId,
} from "@/components/frq/test/questionPane";
import ReviewPage from "@/components/frq/test/reviewPage";
import { SubmissionModal, TimeUpModal } from "@/components/frq/test/testModals";
import { usePendingPartScroll } from "@/components/frq/usePendingPartScroll";
import { getUngradedFrqsCollectionRef } from "@/lib/firestore/frqRefs";
import {
  buildStudentQuestions,
  findQuestionIndexForPart,
  getResponsePartIds,
  getSectionHeading,
} from "@/lib/frq/studentView";
import {
  DEFAULT_TIME_LIMIT_MINUTES,
  toQuestionInput,
} from "@/lib/frq/template";
import type { FRQTemplate } from "@/types/frq";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type FRQTestRendererProps = {
  template: FRQTemplate | null;
  loading?: boolean;
  error?: string | null;
};

/**
 * Answers live in localStorage until they are submitted. A refresh, a closed
 * laptop, or a stray back-navigation used to lose the whole attempt, and there
 * is no server-side draft store to write to.
 */
const getDraftKey = (templateId: string, studentId: string) =>
  `frq-draft:${templateId}:${studentId}`;

const readDraft = (draftKey: string): Record<string, string> => {
  try {
    const stored = window.localStorage.getItem(draftKey);

    if (!stored) {
      return {};
    }

    const parsed: unknown = JSON.parse(stored);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    // A corrupt or unreadable draft must not block the student from starting.
    return {};
  }
};

const FRQTestRenderer = ({
  template,
  loading = false,
  error = null,
}: FRQTestRendererProps) => {
  const router = useRouter();
  const { user } = useUser();

  // The student pages through questions, not parts: one page carries a
  // question's stimulus and every part hanging off it. A legacy flat document
  // normalizes into a single question, so it still renders as one page holding
  // all of its parts, which is what it looked like before this change.
  const questions = useMemo(
    () => (template ? buildStudentQuestions(template) : []),
    [template],
  );

  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  // Keyed by part id, not by position. A page now holds several parts, so an
  // index key could not say which part it meant, and a positional key rebinds
  // to a different part when the template changes shape under a saved draft.
  const [markedForReview, setMarkedForReview] = useState<
    Record<string, boolean>
  >({});
  const [timeRemaining, setTimeRemaining] = useState(
    () => (template?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES) * 60,
  );
  const [timerHidden, setTimerHidden] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const templateId = template?.id ?? "";
  const studentId = user?.uid ?? "";
  const draftKey =
    templateId && studentId ? getDraftKey(templateId, studentId) : "";

  // Seed responses from the saved draft, then keep every part id present so
  // the review grid and submission payload never have holes. The map stays
  // keyed by part id, so work saved before question paging still resolves.
  useEffect(() => {
    const draft = draftKey ? readDraft(draftKey) : {};

    setResponses(
      Object.fromEntries(
        getResponsePartIds(questions).map((partId) => [
          partId,
          draft[partId] ?? "",
        ]),
      ),
    );
    setCurrentQuestionIndex(0);
  }, [questions, draftKey]);

  useEffect(() => {
    if (!draftKey || hasSubmitted) {
      return;
    }

    try {
      window.localStorage.setItem(draftKey, JSON.stringify(responses));
    } catch {
      // A full or disabled localStorage should not interrupt the attempt.
    }
  }, [draftKey, responses, hasSubmitted]);

  const setPendingScrollPartId = usePendingPartScroll(
    getPartAnchorId,
    currentQuestionIndex,
  );

  useEffect(() => {
    setTimeRemaining(
      (template?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES) * 60,
    );
  }, [template?.timeLimitMinutes]);

  useEffect(() => {
    if (hasSubmitted) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((currentTime) =>
        currentTime > 0 ? currentTime - 1 : 0,
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasSubmitted]);

  useEffect(() => {
    if (timeRemaining === 0 && !hasSubmitted) {
      setShowTimeUpPopup(true);
    }
  }, [timeRemaining, hasSubmitted]);

  const submitForGrading = useCallback(async () => {
    if (!template?.id || !user) {
      window.alert("Please sign in before submitting this FRQ for grading.");
      return;
    }

    setSubmitting(true);

    try {
      // Payload shape is unchanged: `responses` stays a flat part-id map, so
      // the grading queue reads submissions written before question paging
      // exactly as it reads new ones.
      await addDoc(getUngradedFrqsCollectionRef(), {
        templateId: template.id,
        subject: template.subject,
        unitId: template.unitId,
        studentId: user.uid,
        responses,
        submittedAt: serverTimestamp(),
      });

      setHasSubmitted(true);
      setShowSubmissionModal(false);
      setShowTimeUpPopup(false);

      // Only clear the draft once the write has actually landed, so a failed
      // submission still leaves the student's work recoverable.
      if (draftKey) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // Nothing to do: the submission already succeeded.
        }
      }

      window.alert("Your FRQ was submitted for grading.");
    } catch (submissionError) {
      console.error("Error submitting FRQ for grading:", submissionError);

      window.alert(
        submissionError instanceof Error
          ? `We could not submit your FRQ: ${submissionError.message}`
          : "We could not submit your FRQ. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [draftKey, responses, template, user]);

  const formattedTime = `${Math.floor(timeRemaining / 3600)}:${String(
    Math.floor((timeRemaining % 3600) / 60),
  ).padStart(2, "0")}:${String(timeRemaining % 60).padStart(2, "0")}`;

  const currentQuestion = questions[currentQuestionIndex];
  const testName = template?.title ?? "FRQ";

  // Index-aligned with the question grid so the footer can offer every part as
  // its own shortcut.
  const questionParts = useMemo(
    () =>
      questions.map((question) =>
        question.parts.map(({ part, label }) => ({ id: part.id, label })),
      ),
    [questions],
  );

  const handleNext = () => {
    if (currentQuestionIndex === questions.length - 1) {
      setShowReviewPage(true);
      return;
    }

    setCurrentQuestionIndex((currentIndex) => currentIndex + 1);
  };

  const jumpToPart = (partId: string) => {
    const questionIndex = findQuestionIndexForPart(questions, partId);

    // -1 means the part is no longer student-facing. Doing nothing beats
    // opening question 1, which would look like the shortcut went to the
    // wrong place.
    if (questionIndex === -1) {
      return;
    }

    setCurrentQuestionIndex(questionIndex);
    setShowReviewPage(false);
    setPendingScrollPartId(partId);
  };

  const toggleMark = (partId: string) => {
    setMarkedForReview((currentValues) => ({
      ...currentValues,
      [partId]: !(currentValues[partId] ?? false),
    }));
  };

  const updateResponse = (partId: string, value: string) => {
    setResponses((currentResponses) => ({
      ...currentResponses,
      [partId]: value,
    }));
  };

  if (loading) {
    return <p className="p-8">Loading FRQ test...</p>;
  }

  if (error) {
    return <p className="p-8">{error}</p>;
  }

  if (!template) {
    return <p className="p-8">FRQ test not found.</p>;
  }

  if (questions.length === 0) {
    return (
      <p className="p-8">
        This FRQ has no questions yet. Check back once a porter has finished
        writing it.
      </p>
    );
  }

  if (!currentQuestion) {
    return <p className="p-8">FRQ test not found.</p>;
  }

  const sectionHeading = getSectionHeading(template);

  // `normalizeFrqTemplate` stores an unauthored stimulus as "", not as absent,
  // so this cannot lean on `??`. Files are checked separately because a
  // stimulus can be an image with no accompanying text.
  const hasStimulus =
    Boolean(currentQuestion.stimulus?.trim()) ||
    (currentQuestion.stimulusFiles?.length ?? 0) > 0;

  const timeUpModal = showTimeUpPopup ? (
    <TimeUpModal
      submitting={submitting}
      onContinue={() => setShowTimeUpPopup(false)}
      onSubmit={() => void submitForGrading()}
    />
  ) : null;

  const submissionModal = showSubmissionModal ? (
    <SubmissionModal
      submitting={submitting}
      onDownload={() =>
        downloadResponsesAsPdf({ testName, questions, responses })
      }
      onSubmit={() => void submitForGrading()}
      onClose={() => setShowSubmissionModal(false)}
    />
  ) : null;

  if (hasSubmitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-black">
        <h1 className="text-4xl font-bold">Test submitted</h1>

        <p className="max-w-md text-center text-gray-600">
          Your responses for {testName} are in the grading queue. You will be
          able to see your score and feedback once a grader has reviewed them.
        </p>

        <button
          type="button"
          className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white"
          onClick={() => router.back()}
        >
          Return to the unit
        </button>
      </main>
    );
  }

  if (showReviewPage) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12 text-black">
        {timeUpModal}
        {submissionModal}

        <ReviewPage
          heading={sectionHeading.reviewHeading}
          questions={questions}
          responses={responses}
          markedForReview={markedForReview}
          onJumpToPart={jumpToPart}
          onReturnToTest={() => setShowReviewPage(false)}
          onOpenSubmission={() => setShowSubmissionModal(true)}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-white text-black">
      {timeUpModal}
      {submissionModal}
      <section className="flex min-h-screen w-full flex-col border-4 border-black">
        <header className="relative flex items-start justify-between px-6 py-3">
          <div>
            <p className="text-sm font-bold">{sectionHeading.label}</p>
            <p className="text-xs">{sectionHeading.subtitle}</p>
          </div>

          <div className="text-center">
            <p className="font-sans text-lg font-bold">
              {timerHidden ? "" : formattedTime}
            </p>

            <button
              type="button"
              className="rounded border border-gray-400 px-2 py-0.5 text-xs"
              onClick={() => setTimerHidden((currentValue) => !currentValue)}
            >
              {timerHidden ? "Show" : "Hide"}
            </button>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 text-sm font-bold text-red-500"
            onClick={() => router.back()}
          >
            <LogOut size={16} />
            Exit Test
          </button>

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[2px] w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #111 0 20px, transparent 20px 24px)",
            }}
          />
        </header>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          {/*
            `pb-20` clears the fixed 56px footer. A page used to hold one part
            and rarely scrolled; stacking a question's parts makes it routine,
            and without the padding the last response box ends underneath the
            footer with no way to scroll further.
          */}
          <section className="overflow-y-auto border-b-2 border-solid border-gray-500 p-8 pb-20 lg:border-b-0 lg:border-r-[3px]">
            {/*
              Exam-wide directions and the open question's stimulus are separate
              fields and both may be present, so the stimulus is stacked under
              the directions rather than replacing them.
            */}
            <RenderContent
              content={toQuestionInput(
                template.directions,
                template.directionsFiles,
              )}
              origin="question"
            />

            {hasStimulus && (
              <div className="mt-8 border-t border-gray-300 pt-8">
                <RenderContent
                  content={toQuestionInput(
                    currentQuestion.stimulus,
                    currentQuestion.stimulusFiles,
                  )}
                  origin="question"
                />
              </div>
            )}
          </section>

          <section className="overflow-y-auto p-8 pb-20">
            <QuestionPane
              question={currentQuestion}
              responses={responses}
              markedForReview={markedForReview}
              onResponseChange={updateResponse}
              onToggleMark={toggleMark}
            />
          </section>
        </div>

        <FRQFooter
          testName={testName}
          currentFrqIndex={currentQuestionIndex}
          totalFrqs={questions.length}
          questionParts={questionParts}
          onJumpToPart={jumpToPart}
          onPrevious={() => {
            setCurrentQuestionIndex((currentIndex) =>
              Math.max(currentIndex - 1, 0),
            );
          }}
          onNext={handleNext}
          onJumpToFrq={(index) => {
            setCurrentQuestionIndex(index);
            setShowReviewPage(false);
          }}
        />
      </section>
    </main>
  );
};

export default FRQTestRenderer;
