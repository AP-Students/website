"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { db } from "@/lib/firebase";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronUp, LogOut } from "lucide-react";
import { runTransaction, serverTimestamp } from "firebase/firestore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getGradedFrqDocRef,
  getUngradedFrqDocRef,
} from "@/lib/firestore/frqRefs";
import {
  getAllParts,
  getPartLabel,
  getPartPoints,
  getTemplatePoints,
  toQuestionInput,
} from "@/lib/frq/template";

import { useUser } from "@/components/hooks/UserContext";
import type {
  FRQTemplate,
  FRQTemplatePart,
  GradableFRQSubmission,
} from "@/types/frq";

type FRQGradingRendererProps = {
  submission: GradableFRQSubmission | null;
  template: FRQTemplate | null;
};

/** Points awarded per criterion, and the grader's note, for one part. */
type PartGrade = {
  feedback: string;
  criteria: Record<string, number>;
};

const createEmptyGrade = (question: FRQTemplatePart): PartGrade => ({
  feedback: "",
  criteria: Object.fromEntries(
    (question.criteria ?? []).map((criterion) => [criterion.id, 0]),
  ),
});

const FRQGradingRenderer = ({
  submission,
  template,
}: FRQGradingRendererProps) => {
  const { user } = useUser();

  // Grading covers every part the template defines, including ones marked
  // legacy: an older submission may still hold a response to them.
  const questions = useMemo(
    () => (template ? getAllParts(template) : []),
    [template],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [grades, setGrades] = useState<Record<string, PartGrade>>(() =>
    Object.fromEntries(
      questions.map((question) => [question.id, createEmptyGrade(question)]),
    ),
  );

  const possiblePoints = getTemplatePoints(questions);

  const earnedPoints = questions.reduce((total, question) => {
    const partGrade = grades[question.id];

    if (!partGrade) {
      return total;
    }

    return (
      total +
      (question.criteria ?? []).reduce(
        (partTotal, criterion) =>
          partTotal + (partGrade.criteria[criterion.id] ?? 0),
        0,
      )
    );
  }, 0);

  // A part counts as graded once the grader has written a note for it, which is
  // the only signal that distinguishes "looked at and awarded zero" from
  // "not looked at yet".
  const gradedPartCount = questions.filter((question) =>
    (grades[question.id]?.feedback ?? "").trim(),
  ).length;

  const setCriterionPoints = (
    questionId: string,
    criterionId: string,
    rawPoints: number,
    maximumPoints: number,
  ) => {
    const points = Math.min(
      Math.max(Number.isFinite(rawPoints) ? Math.round(rawPoints) : 0, 0),
      maximumPoints,
    );

    setGrades((currentGrades) => ({
      ...currentGrades,
      [questionId]: {
        feedback: currentGrades[questionId]?.feedback ?? "",
        criteria: {
          ...(currentGrades[questionId]?.criteria ?? {}),
          [criterionId]: points,
        },
      },
    }));
  };

  const setPartFeedback = (questionId: string, feedback: string) => {
    setGrades((currentGrades) => ({
      ...currentGrades,
      [questionId]: {
        feedback,
        criteria: currentGrades[questionId]?.criteria ?? {},
      },
    }));
  };

  const submitGradeReport = async () => {
    if (!submission?.id || !user || !template) {
      return;
    }

    if (!overallFeedback.trim()) {
      window.alert("Add overall feedback before submitting the grade report.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the submission ID as the result ID and atomically claim the queue
      // item. Firestore retries concurrent transactions, so only one grader
      // can successfully issue a report for a submission.
      const queueRef = getUngradedFrqDocRef(submission.id);
      const resultRef = getGradedFrqDocRef(submission.id);

      await runTransaction(db, async (transaction) => {
        const [queueSnapshot, resultSnapshot] = await Promise.all([
          transaction.get(queueRef),
          transaction.get(resultRef),
        ]);

        if (!queueSnapshot.exists() || resultSnapshot.exists()) {
          throw new Error("This submission has already been graded.");
        }

        const queuedSubmission = queueSnapshot.data() as GradableFRQSubmission;

        transaction.set(resultRef, {
          sourceSubmissionId: submission.id,
          templateId: queuedSubmission.templateId,
          subject: queuedSubmission.subject,
          unitId: queuedSubmission.unitId,
          studentId: queuedSubmission.studentId,
          responses: queuedSubmission.responses,
          submittedAt: queuedSubmission.submittedAt,
          score: `${earnedPoints}/${possiblePoints}`,
          feedback: overallFeedback.trim(),
          // Per-part detail is what lets the student's feedback page show which
          // rubric lines were earned instead of a bare aggregate.
          grades: questions.map((question) => ({
            questionId: question.id,
            feedback: grades[question.id]?.feedback?.trim() ?? "",
            criteria: (question.criteria ?? []).map((criterion) => ({
              criterionId: criterion.id,
              points: grades[question.id]?.criteria[criterion.id] ?? 0,
            })),
          })),
          graderId: user.uid,
          gradedAt: serverTimestamp(),
        });

        transaction.delete(queueRef);
      });

      window.alert("Grade report submitted.");
    } catch (error) {
      console.error("Error submitting FRQ grade:", error);

      window.alert(
        error instanceof Error &&
          error.message === "This submission has already been graded."
          ? "This submission was just graded by someone else. Refresh the queue."
          : "Unable to submit the grade report. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return <div className="p-8">FRQ submission not found.</div>;

  if (!template) {
    return (
      <div className="p-8">
        The FRQ this submission came from no longer exists, so it cannot be
        graded.
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="p-8">
        This FRQ has no questions to grade.
      </div>
    );
  }

  const currentGrade = grades[currentQuestion.id];
  const currentCriteria = currentQuestion.criteria ?? [];
  const currentEarned = currentCriteria.reduce(
    (total, criterion) => total + (currentGrade?.criteria[criterion.id] ?? 0),
    0,
  );

  return (
    <div className="flex min-h-screen flex-col border-t-[6px] border-black bg-white pb-14">
      <header className="flex min-h-[72px] items-center border-b border-dashed border-gray-400 bg-white px-10 py-3">
        <div className="flex flex-1 items-center gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submitGradeReport()}
            className="min-w-[176px] rounded-full bg-[#294ad1] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#203cad] disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Grade Report"}
          </button>

          <p className="text-sm font-semibold tabular-nums">
            {earnedPoints}/{possiblePoints} points
          </p>
        </div>

        <div className="flex flex-1 justify-center">
          <p className="text-sm font-semibold text-gray-900">
            {gradedPartCount}/{questions.length} Questions Graded
          </p>
        </div>

        <div className="flex flex-1 justify-end">
          <Link
            href="/frq-grading"
            className="flex items-center gap-2 text-sm font-semibold text-red-500 transition-colors hover:text-red-600 hover:underline"
          >
            <LogOut aria-hidden="true" size={19} strokeWidth={2} />
            Return To Grading Queue
          </Link>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 divide-y divide-gray-300 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="px-10 py-8">
          <h2 className="mb-5 text-base font-semibold">
            {template.title} | Part {getPartLabel(currentIndex)} | Grader
            Response
          </h2>

          <div className="mb-3 flex h-9 items-center bg-gray-100 pr-3">
            <span className="flex h-full w-9 items-center justify-center bg-black font-bold text-white">
              {getPartLabel(currentIndex)}
            </span>
            <span className="px-3 font-semibold tabular-nums">
              {currentEarned}/{getPartPoints(currentQuestion)} Points
            </span>
          </div>

          <div className="space-y-1">
            {currentCriteria.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-gray-500">
                This part has no grading criteria, so it is worth zero points.
                Add criteria in the FRQ editor.
              </p>
            ) : (
              currentCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="flex min-h-9 items-center gap-2"
                >
                  <div className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                    <span className="block">
                      {criterion.description || "Untitled criterion"}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={criterion.points}
                      step={1}
                      aria-label={`Points for ${
                        criterion.description || "criterion"
                      }`}
                      value={currentGrade?.criteria[criterion.id] ?? 0}
                      onChange={(event) =>
                        setCriterionPoints(
                          currentQuestion.id,
                          criterion.id,
                          Number(event.target.value),
                          criterion.points,
                        )
                      }
                      className="h-8 w-16 rounded-md border border-gray-300 px-2 text-center"
                    />
                    <span>/</span>
                    <span className="tabular-nums">{criterion.points}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4">
            <label
              htmlFor="part-feedback"
              className="text-sm font-semibold"
            >
              Feedback for part {getPartLabel(currentIndex)}
            </label>
            <textarea
              id="part-feedback"
              value={currentGrade?.feedback ?? ""}
              placeholder="Explain what this part earned and what was missing."
              onChange={(event) =>
                setPartFeedback(currentQuestion.id, event.target.value)
              }
              className="mt-2 min-h-[110px] w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none"
            />
          </div>

          <div className="mt-6">
            <label
              htmlFor="overall-feedback"
              className="text-sm font-semibold"
            >
              Overall feedback
            </label>
            <textarea
              id="overall-feedback"
              value={overallFeedback}
              placeholder="Summarize the response as a whole. Required to submit."
              onChange={(event) => setOverallFeedback(event.target.value)}
              className="mt-2 min-h-[110px] w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none"
            />
          </div>
        </section>

        <section className="px-10 py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {template.title} | {questions.length}{" "}
              {questions.length === 1 ? "Question" : "Questions"}
            </h2>

            <button
              type="button"
              onClick={() => setShowPrompt((visible) => !visible)}
              className="rounded-md bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              {showPrompt ? "Hide Prompt" : "Show Prompt"}
            </button>
          </div>

          {showPrompt && (
            <div className="mb-5 border-b border-gray-200 pb-5 text-sm leading-6 text-gray-900">
              <RenderContent
                content={toQuestionInput(
                  template.directions,
                  template.directionsFiles,
                )}
                origin="question"
              />

              <div className="mt-4">
                <RenderContent
                  content={toQuestionInput(
                    currentQuestion.prompt,
                    currentQuestion.promptFiles,
                  )}
                  origin="question"
                />
              </div>
            </div>
          )}

          <h3 className="mb-2 text-sm font-semibold">Student response</h3>

          <div
            className="min-h-[260px] rounded-md border border-gray-400 p-4 text-sm leading-6 [&_p]:mb-3"
            // The student response is authored in a contenteditable that
            // sanitizes on every keystroke and again on submit, so what is
            // stored is already safe to render.
            dangerouslySetInnerHTML={{
              __html:
                submission.responses[currentQuestion.id] ??
                "<em>No response submitted for this part.</em>",
            }}
          />
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-between border-t-2 border-gray-300 bg-white px-8">
        <p className="font-semibold">{template.title}</p>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            aria-label="Previous part"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            className="rounded-md bg-black p-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>

          <Popover open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md bg-black px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                Part {getPartLabel(currentIndex)} of {questions.length}
                <ChevronUp aria-hidden="true" className="size-4" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="center" side="top" className="w-40 p-2">
              <div className="flex flex-col gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsNavigationOpen(false);
                    }}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      index === currentIndex
                        ? "bg-[#294ad1] font-bold text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Part {getPartLabel(index)}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            aria-label="Next part"
            disabled={currentIndex === questions.length - 1}
            onClick={() =>
              setCurrentIndex((index) =>
                Math.min(index + 1, questions.length - 1),
              )
            }
            className="rounded-md bg-black p-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Student: <span className="font-mono">{submission.studentId}</span>
        </p>
      </footer>
    </div>
  );
};

export default FRQGradingRenderer;
