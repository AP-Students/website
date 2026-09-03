"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { runTransaction, serverTimestamp } from "firebase/firestore";
import {
  getGradedFrqDocRef,
  getSelfGradedFrqDocRef,
  getUngradedFrqDocRef,
} from "@/lib/firestore/frqRefs";
import GradingFooter from "@/components/frq/grading/gradingFooter";
import GradingPartCard, {
  getGradingPartAnchorId,
} from "@/components/frq/grading/partCard";
import {
  buildGradingQuestions,
  buildStoredGrades,
  clampCriterionPoints,
  countGradedParts,
  createEmptyGrades,
  findGradingQuestionIndexForPart,
  getEarnedPoints,
  getGradingParts,
  getQuestionLabel,
} from "@/lib/frq/gradingView";
import type { PartGrade } from "@/lib/frq/gradingView";
import { getTemplatePoints, toQuestionInput } from "@/lib/frq/template";

import { useUser } from "@/components/hooks/UserContext";
import type { FRQTemplate, GradableFRQSubmission } from "@/types/frq";

type FRQGradingRendererProps = {
  submission: GradableFRQSubmission | null;
  template: FRQTemplate | null;
  /**
   * Whoever is grading wrote the responses themselves. The scoring is
   * identical; where the result lands is not. A self-assessment is written to
   * `self-graded-frqs`, never to the collection an official FiveHive grade
   * lives in, because nobody's score of their own work carries that authority.
   */
  selfGrading?: boolean;
  /**
   * The viewer holds staff access, so the queue is somewhere they can go back
   * to. Distinct from `!selfGrading`: a member grading their own attempt is
   * doing both at once.
   */
  canReturnToQueue?: boolean;
};

const FRQGradingRenderer = ({
  submission,
  template,
  selfGrading = false,
  canReturnToQueue = !selfGrading,
}: FRQGradingRendererProps) => {
  const { user } = useUser();
  const router = useRouter();

  // The grader pages through questions, not parts: one page carries a
  // question's stimulus and every part hanging off it. Grading still covers
  // every part the template defines, including ones marked legacy, because an
  // older submission may still hold a response to them.
  const questions = useMemo(
    () => (template ? buildGradingQuestions(template) : []),
    [template],
  );

  const parts = useMemo(() => getGradingParts(questions), [questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [pendingScrollPartId, setPendingScrollPartId] = useState<string | null>(
    null,
  );
  // Keyed by part id, which is what the stored response map and every existing
  // grade are keyed by. Grouping parts under questions changes navigation and
  // nothing about how a grade resolves.
  const [grades, setGrades] = useState<Record<string, PartGrade>>(() =>
    createEmptyGrades(parts),
  );

  // Runs after the target question has rendered, so the part being scrolled to
  // is in the DOM. Jumping to a part on another question sets the index and
  // this id together, and React commits both before the effect fires.
  useEffect(() => {
    if (!pendingScrollPartId) {
      return;
    }

    document
      .getElementById(getGradingPartAnchorId(pendingScrollPartId))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    setPendingScrollPartId(null);
  }, [pendingScrollPartId, currentQuestionIndex]);

  const possiblePoints = getTemplatePoints(parts);
  const earnedPoints = getEarnedPoints(parts, grades);
  const gradedPartCount = countGradedParts(parts, grades);

  // Index-aligned with the question grid so the footer can offer every part as
  // its own shortcut.
  const questionParts = useMemo(
    () =>
      questions.map((question) =>
        question.parts.map(({ part, label }) => ({ id: part.id, label })),
      ),
    [questions],
  );

  const setCriterionPoints = (
    partId: string,
    criterionId: string,
    rawPoints: number,
    maximumPoints: number,
  ) => {
    const points = clampCriterionPoints(rawPoints, maximumPoints);

    setGrades((currentGrades) => ({
      ...currentGrades,
      [partId]: {
        feedback: currentGrades[partId]?.feedback ?? "",
        criteria: {
          ...(currentGrades[partId]?.criteria ?? {}),
          [criterionId]: points,
        },
      },
    }));
  };

  const setPartFeedback = (partId: string, feedback: string) => {
    setGrades((currentGrades) => ({
      ...currentGrades,
      [partId]: {
        feedback,
        criteria: currentGrades[partId]?.criteria ?? {},
      },
    }));
  };

  const jumpToPart = (partId: string) => {
    const questionIndex = findGradingQuestionIndexForPart(questions, partId);

    // -1 means the template no longer defines the part. Doing nothing beats
    // opening question 1, which would look like the shortcut went to the wrong
    // place.
    if (questionIndex === -1) {
      return;
    }

    setCurrentQuestionIndex(questionIndex);
    setPendingScrollPartId(partId);
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

      // A self-assessment is not an official result and is never written where
      // one would be read from. Claiming the queue entry either way is what
      // stops the same attempt from being scored twice: a student who grades
      // themselves has taken the attempt out of the staff queue, and a staff
      // grade can no longer land on it.
      const resultRef = selfGrading
        ? getSelfGradedFrqDocRef(submission.id)
        : getGradedFrqDocRef(submission.id);

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
          // rubric lines were earned instead of a bare aggregate. The payload
          // is unchanged by question paging: still one flat entry per part,
          // still keyed by part id, still in reading order.
          grades: buildStoredGrades(parts, grades),
          graderId: user.uid,
          gradedAt: serverTimestamp(),
        });

        transaction.delete(queueRef);
      });

      if (selfGrading) {
        // The result doc is keyed by the submission id, so this is now readable
        // and it is the only FRQ page a non-staff account can open.
        router.push(`/frq-feedback/${submission.id}`);
        return;
      }

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

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div className="p-8">This FRQ has no questions to grade.</div>;
  }

  const questionLabel = getQuestionLabel(
    questions.length,
    currentQuestionIndex,
  );

  // `normalizeFrqTemplate` stores an unauthored stimulus as "", not as absent,
  // so this cannot lean on `??`. Files are checked separately because a
  // stimulus can be an image with no accompanying text.
  const hasStimulus =
    Boolean(currentQuestion.stimulus?.trim()) ||
    (currentQuestion.stimulusFiles?.length ?? 0) > 0;

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
            {isSubmitting
              ? "Submitting..."
              : selfGrading
                ? "Submit Self-Grade"
                : "Submit Grade Report"}
          </button>

          <p className="text-sm font-semibold tabular-nums">
            {earnedPoints}/{possiblePoints} points
          </p>
        </div>

        <div className="flex flex-1 justify-center">
          {/*
            Counts parts, and now says so. It read "Questions Graded" back when
            the page paged through a flat part list and the two words meant the
            same thing.
          */}
          <p className="text-sm font-semibold text-gray-900">
            {gradedPartCount}/{parts.length}{" "}
            {parts.length === 1 ? "Part" : "Parts"} Graded
          </p>
        </div>

        <div className="flex flex-1 justify-end">
          <Link
            href={
              canReturnToQueue
                ? "/frq-grading"
                : `/subject/${submission.subject}`
            }
            className="flex items-center gap-2 text-sm font-semibold text-red-500 transition-colors hover:text-red-600 hover:underline"
          >
            <LogOut aria-hidden="true" size={19} strokeWidth={2} />
            {canReturnToQueue ? "Return To Grading Queue" : "Exit Self-Grading"}
          </Link>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 items-start divide-y divide-gray-300 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/*
          Sticky rather than a scroll container: the page itself scrolls, and a
          question's parts now stack tall enough that the reading material would
          otherwise scroll out of sight while grading the last part.
        */}
        <section className="px-10 py-8 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">
              {template.title} | {questions.length}{" "}
              {questions.length === 1 ? "Question" : "Questions"}
            </h2>

            <button
              type="button"
              onClick={() => setShowPrompt((visible) => !visible)}
              className="shrink-0 rounded-md bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              {showPrompt ? "Hide Prompt" : "Show Prompt"}
            </button>
          </div>

          {showPrompt && (
            <div className="mb-5 border-b border-gray-200 pb-5 text-sm leading-6 text-gray-900">
              {/*
                Exam-wide directions and the open question's stimulus are
                separate fields and both may be present, so the stimulus is
                stacked under the directions rather than replacing them.
              */}
              <RenderContent
                content={toQuestionInput(
                  template.directions,
                  template.directionsFiles,
                )}
                origin="question"
              />

              {hasStimulus && (
                <div className="mt-6 border-t border-gray-300 pt-6">
                  <RenderContent
                    content={toQuestionInput(
                      currentQuestion.stimulus,
                      currentQuestion.stimulusFiles,
                    )}
                    origin="question"
                  />
                </div>
              )}
            </div>
          )}

          {/*
            Outside the prompt toggle because it is required to submit, so it
            has to stay reachable from whichever question is open.
          */}
          <div>
            <label htmlFor="overall-feedback" className="text-sm font-semibold">
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
          <h2 className="mb-5 text-base font-semibold">
            {questionLabel ?? template.title} | Grader Response
          </h2>

          <div className="space-y-10">
            {currentQuestion.parts.map(({ part, label }) => (
              <GradingPartCard
                key={part.id}
                part={part}
                label={label}
                response={submission.responses[part.id]}
                grade={grades[part.id]}
                onCriterionPointsChange={(criterionId, rawPoints) =>
                  setCriterionPoints(
                    part.id,
                    criterionId,
                    rawPoints,
                    (part.criteria ?? []).find(
                      (criterion) => criterion.id === criterionId,
                    )?.points ?? 0,
                  )
                }
                onFeedbackChange={(feedback) =>
                  setPartFeedback(part.id, feedback)
                }
              />
            ))}
          </div>
        </section>
      </main>

      <GradingFooter
        testName={template.title}
        studentId={submission.studentId}
        currentQuestionIndex={currentQuestionIndex}
        questionCount={questions.length}
        questionParts={questionParts}
        onPrevious={() =>
          setCurrentQuestionIndex((index) => Math.max(index - 1, 0))
        }
        onNext={() =>
          setCurrentQuestionIndex((index) =>
            Math.min(index + 1, questions.length - 1),
          )
        }
        onJumpToQuestion={setCurrentQuestionIndex}
        onJumpToPart={jumpToPart}
      />
    </div>
  );
};

export default FRQGradingRenderer;
