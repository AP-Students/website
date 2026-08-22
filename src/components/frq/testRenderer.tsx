"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { useUser } from "@/components/hooks/UserContext";
import FRQFooter from "@/components/frq/FRQFooter";
import FRQResponseEditor from "@/components/frq/responseEditor";
import { getUngradedFrqsCollectionRef } from "@/lib/firestore/frqRefs";
import {
  DEFAULT_TIME_LIMIT_MINUTES,
  getPartLabel,
  getStudentFacingParts,
  hasResponseText,
  toQuestionInput,
} from "@/lib/frq/template";
import type { FRQTemplate } from "@/types/frq";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { Bookmark, LogOut } from "lucide-react";
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

  // PR 1 keeps the flat part list so behaviour is unchanged. PR 3 replaces this
  // with per-question paging.
  const questions = useMemo(
    () => (template ? getStudentFacingParts(template) : []),
    [template],
  );

  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentFRQIndex, setCurrentFRQIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<
    Record<number, boolean>
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

  // Seed responses from the saved draft, then keep every question id present so
  // the review grid and submission payload never have holes.
  useEffect(() => {
    const draft = draftKey ? readDraft(draftKey) : {};

    setResponses(
      Object.fromEntries(
        questions.map((question) => [question.id, draft[question.id] ?? ""]),
      ),
    );
    setCurrentFRQIndex(0);
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

  const currentFRQ = questions[currentFRQIndex];
  const testName = template?.title ?? "FRQ";

  const handleNext = () => {
    if (currentFRQIndex === questions.length - 1) {
      setShowReviewPage(true);
      return;
    }

    setCurrentFRQIndex((currentIndex) => currentIndex + 1);
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

  if (!currentFRQ) {
    return <p className="p-8">FRQ test not found.</p>;
  }

  const timeUpModal = showTimeUpPopup ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-up-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 id="time-up-title" className="text-xl font-bold">
          Time is up
        </h2>

        <p className="mt-3 text-sm text-gray-600">
          Your time has ended. You can submit your test now or continue working.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded border border-gray-400 px-4 py-2 font-semibold"
            onClick={() => setShowTimeUpPopup(false)}
          >
            Continue Working
          </button>

          <button
            type="button"
            className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            disabled={submitting}
            onClick={() => void submitForGrading()}
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const downloadResponsesAsPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      window.alert(
        "The browser blocked the PDF window. Allow pop-ups and try again.",
      );
      return;
    }

    const getPlainText = (html: string) => {
      const parsedDocument = new DOMParser().parseFromString(html, "text/html");

      return parsedDocument.body.textContent?.trim() || "No response";
    };

    const printDocument = printWindow.document;

    printDocument.title = `${testName} Responses`;
    printDocument.head.replaceChildren();
    printDocument.body.replaceChildren();

    const styleElement = printDocument.createElement("style");

    styleElement.textContent = `
    body {
      margin: 40px;
      color: #111;
      font-family: Georgia, "Times New Roman", serif;
    }

    h1 {
      margin-bottom: 32px;
      text-align: center;
    }

    .response {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .response h2 {
      border-bottom: 1px solid #999;
      padding-bottom: 8px;
      font-size: 18px;
    }

    .response p {
      white-space: pre-wrap;
      line-height: 1.6;
    }
  `;

    printDocument.head.appendChild(styleElement);

    const pageTitle = printDocument.createElement("h1");
    pageTitle.textContent = `${testName} Responses`;
    printDocument.body.appendChild(pageTitle);

    questions.forEach((question, index) => {
      const section = printDocument.createElement("section");
      section.className = "response";

      const heading = printDocument.createElement("h2");
      heading.textContent = `Part ${getPartLabel(index)}`;

      const responseText = printDocument.createElement("p");
      responseText.textContent = getPlainText(responses[question.id] ?? "");

      section.append(heading, responseText);
      printDocument.body.appendChild(section);
    });

    printWindow.focus();

    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const submissionModal = showSubmissionModal ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-title"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <button
          type="button"
          aria-label="Close submission popup"
          className="absolute right-4 top-3 text-2xl text-gray-500 hover:text-black"
          onClick={() => setShowSubmissionModal(false)}
        >
          ×
        </button>

        <h2 id="submission-title" className="text-2xl font-bold">
          Submit Your Test
        </h2>

        <p className="mt-3 text-sm text-gray-600">
          Download a copy of your responses or submit them for grading.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="rounded border border-blue-700 px-5 py-3 font-semibold text-blue-700"
            onClick={downloadResponsesAsPdf}
          >
            Download Responses as PDF
          </button>

          <button
            type="button"
            className="rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
            onClick={() => void submitForGrading()}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit for Grading"}
          </button>

          <button
            type="button"
            className="rounded border border-black px-5 py-3 font-semibold text-black hover:bg-gray-100"
            onClick={() => setShowSubmissionModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center text-4xl font-normal">Check Your Work</h1>

          <div className="mx-auto mt-6 max-w-2xl space-y-0.5 text-center text-base leading-5">
            <p>Review your responses before submitting your test.</p>
            <p>Select a part to return to that question.</p>
          </div>

          <section className="mt-8 rounded-xl bg-white p-8 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-300 pb-5">
              <h2 className="text-xl font-bold">
                Section II: Free-Response Questions
              </h2>

              <div className="flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-dashed border-gray-500" />
                  Unanswered
                </span>

                <span className="flex items-center gap-2">
                  <Bookmark
                    size={20}
                    fill="currentColor"
                    className="text-red-600"
                  />
                  For Review
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-start gap-10 py-6 pl-6">
              {questions.map((question, index) => {
                const isAnswered = hasResponseText(responses[question.id]);
                const isMarked = markedForReview[index] ?? false;

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`relative flex h-14 w-14 items-center justify-center text-xl font-bold ${
                      isAnswered
                        ? "bg-blue-700 text-white"
                        : "border-2 border-dashed border-gray-500 bg-white text-black"
                    }`}
                    onClick={() => {
                      setCurrentFRQIndex(index);
                      setShowReviewPage(false);
                    }}
                  >
                    {getPartLabel(index)}

                    {isMarked && (
                      <Bookmark
                        size={19}
                        fill="currentColor"
                        className="absolute -right-2 -top-2 text-red-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-gray-300 pt-6">
              <button
                type="button"
                className="rounded-full border border-blue-700 px-6 py-3 font-semibold text-blue-700"
                onClick={() => setShowReviewPage(false)}
              >
                Return to Test
              </button>

              <button
                type="button"
                className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white"
                onClick={() => setShowSubmissionModal(true)}
              >
                Submit Test
              </button>
            </div>
          </section>
        </div>
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
            <p className="text-sm font-bold">Section II</p>
            <p className="text-xs">Free response</p>
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
          <section className="overflow-y-auto border-b-2 border-solid border-gray-500 p-8 lg:border-b-0 lg:border-r-[3px]">
            <RenderContent
              content={toQuestionInput(
                template.directions,
                template.directionsFiles,
              )}
              origin="question"
            />
          </section>

          <section className="p-8">
            <div className="mb-6 w-full max-w-[50rem] bg-gray-100">
              <div className="flex h-8 items-center">
                <span className="flex h-8 w-8 items-center justify-center bg-black text-lg font-bold text-white">
                  {getPartLabel(currentFRQIndex)}
                </span>

                <button
                  type="button"
                  aria-pressed={markedForReview[currentFRQIndex] ?? false}
                  className="flex h-full items-center gap-2 px-4 text-sm font-semibold"
                  onClick={() => {
                    setMarkedForReview((currentValues) => ({
                      ...currentValues,
                      [currentFRQIndex]: !(
                        currentValues[currentFRQIndex] ?? false
                      ),
                    }));
                  }}
                >
                  <Bookmark
                    size={24}
                    strokeWidth={2}
                    fill={
                      markedForReview[currentFRQIndex] ? "currentColor" : "none"
                    }
                    className={
                      markedForReview[currentFRQIndex]
                        ? "text-red-600"
                        : "text-black"
                    }
                  />

                  <span>Mark for Review</span>
                </button>
              </div>
            </div>

            <div className="mb-4 font-sans text-sm">
              <RenderContent
                content={toQuestionInput(
                  currentFRQ.prompt,
                  currentFRQ.promptFiles,
                )}
                origin="question"
              />
            </div>

            <div className="w-full max-w-[50rem]">
              <FRQResponseEditor
                ariaLabel={`Response for part ${getPartLabel(currentFRQIndex)}`}
                value={responses[currentFRQ.id] ?? ""}
                onChange={(newResponse) => {
                  setResponses((currentResponses) => ({
                    ...currentResponses,
                    [currentFRQ.id]: newResponse,
                  }));
                }}
              />
            </div>
          </section>
        </div>

        <FRQFooter
          testName={testName}
          currentFrqIndex={currentFRQIndex}
          totalFrqs={questions.length}
          onPrevious={() => {
            setCurrentFRQIndex((currentIndex) => Math.max(currentIndex - 1, 0));
          }}
          onNext={handleNext}
          onJumpToFrq={(index) => {
            setCurrentFRQIndex(index);
            setShowReviewPage(false);
          }}
        />
      </section>
    </main>
  );
};

export default FRQTestRenderer;
