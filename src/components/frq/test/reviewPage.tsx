"use client";

import type { StudentQuestion } from "@/lib/frq/studentView";
import { hasResponseText } from "@/lib/frq/template";
import { Bookmark } from "lucide-react";

type ReviewPageProps = {
  heading: string;
  questions: StudentQuestion[];
  responses: Record<string, string>;
  markedForReview: Record<string, boolean>;
  onJumpToPart: (partId: string) => void;
  onReturnToTest: () => void;
  onOpenSubmission: () => void;
};

/**
 * "Check Your Work". Squares are grouped under their question because part
 * labels restart at A in every question, so a bare grid of letters would show
 * several squares all labelled A with no way to tell them apart.
 */
const ReviewPage = ({
  heading,
  questions,
  responses,
  markedForReview,
  onJumpToPart,
  onReturnToTest,
  onOpenSubmission,
}: ReviewPageProps) => (
  <div className="mx-auto max-w-5xl">
    <h1 className="text-center text-4xl font-normal">Check Your Work</h1>

    <div className="mx-auto mt-6 max-w-2xl space-y-0.5 text-center text-base leading-5">
      <p>Review your responses before submitting your test.</p>
      <p>Select a part to return to that question.</p>
    </div>

    <section className="mt-8 rounded-xl bg-white p-8 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-300 pb-5">
        <h2 className="text-xl font-bold">{heading}</h2>

        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 border-2 border-dashed border-gray-500" />
            Unanswered
          </span>

          <span className="flex items-center gap-2">
            <Bookmark size={20} fill="currentColor" className="text-red-600" />
            For Review
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-8 py-2 pl-6">
        {questions.map((question, questionIndex) => (
          <div key={question.id}>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-600">
              Question {questionIndex + 1}
            </h3>

            <div className="flex flex-wrap items-center justify-start gap-10">
              {question.parts.map(({ part, label }) => {
                const isAnswered = hasResponseText(responses[part.id]);
                const isMarked = markedForReview[part.id] ?? false;

                return (
                  <button
                    key={part.id}
                    type="button"
                    aria-label={`Question ${questionIndex + 1}, part ${label}`}
                    className={`relative flex h-14 w-14 items-center justify-center text-xl font-bold ${
                      isAnswered
                        ? "bg-blue-700 text-white"
                        : "border-2 border-dashed border-gray-500 bg-white text-black"
                    }`}
                    onClick={() => onJumpToPart(part.id)}
                  >
                    {label}

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
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-gray-300 pt-6">
        <button
          type="button"
          className="rounded-full border border-blue-700 px-6 py-3 font-semibold text-blue-700"
          onClick={onReturnToTest}
        >
          Return to Test
        </button>

        <button
          type="button"
          className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white"
          onClick={onOpenSubmission}
        >
          Submit Test
        </button>
      </div>
    </section>
  </div>
);

export default ReviewPage;
