"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { getPartEarnedPoints } from "@/lib/frq/gradingView";
import type { PartGrade } from "@/lib/frq/gradingView";
import { getPartPoints, toQuestionInput } from "@/lib/frq/template";
import type { FRQTemplatePart } from "@/types/frq";

/**
 * DOM id of one part's block. The footer's part shortcuts scroll to these,
 * which is how a grader still reaches an individual part now that a page holds
 * all of a question's parts at once.
 *
 * Read back with `getElementById` rather than `querySelector`, because a part
 * id comes from Firestore and may contain characters that need escaping in a
 * CSS selector but are fine in an id lookup.
 */
export const getGradingPartAnchorId = (partId: string) =>
  `frq-grade-part-${partId}`;

type GradingPartCardProps = {
  part: FRQTemplatePart;
  label: string;
  response: string | undefined;
  grade: PartGrade | undefined;
  onCriterionPointsChange: (criterionId: string, rawPoints: number) => void;
  onFeedbackChange: (feedback: string) => void;
};

/** One part: what the student wrote, what it is worth, and what it earned. */
const GradingPartCard = ({
  part,
  label,
  response,
  grade,
  onCriterionPointsChange,
  onFeedbackChange,
}: GradingPartCardProps) => {
  const criteria = part.criteria ?? [];
  // Unique per part. A page used to hold exactly one, so a fixed id was safe;
  // stacking a question's parts would put several elements on the same id and
  // point every label at the first textarea.
  const feedbackFieldId = `${getGradingPartAnchorId(part.id)}-feedback`;

  return (
    <article
      id={getGradingPartAnchorId(part.id)}
      // Leaves room above the block so a scrolled-to part is not flush against
      // the top edge of the pane.
      className="scroll-mt-6"
    >
      <div className="mb-3 flex h-9 items-center bg-gray-100 pr-3">
        <span className="flex h-full w-9 items-center justify-center bg-black font-bold text-white">
          {label}
        </span>
        <span className="px-3 font-semibold tabular-nums">
          {getPartEarnedPoints(part, grade)}/{getPartPoints(part)} Points
        </span>
      </div>

      <div className="mb-4 text-sm leading-6 text-gray-900">
        <RenderContent
          content={toQuestionInput(part.prompt, part.promptFiles)}
          origin="question"
        />
      </div>

      <h3 className="mb-2 text-sm font-semibold">Student response</h3>

      {/*
        Rendered through the component the student's own feedback page uses,
        rather than injected as raw HTML. Injecting it made the grader the one
        reader who saw `$@x^2$` as literal text while the student who wrote it
        saw the equation, so a response could be marked down for notation the
        grader was never shown.
      */}
      <div className="min-h-[180px] rounded-md border border-gray-400 p-4 text-sm leading-6 [&_p]:mb-3">
        {response === undefined ? (
          <p className="italic text-gray-500">
            No response submitted for this part.
          </p>
        ) : (
          <RenderContent
            content={toQuestionInput(response, [])}
            origin="content"
          />
        )}
      </div>

      <div className="mt-4 space-y-1">
        {criteria.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-gray-500">
            This part has no grading criteria, so it is worth zero points. Add
            criteria in the FRQ editor.
          </p>
        ) : (
          criteria.map((criterion) => (
            <div key={criterion.id} className="flex min-h-9 items-center gap-2">
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
                  value={grade?.criteria[criterion.id] ?? 0}
                  onChange={(event) =>
                    onCriterionPointsChange(
                      criterion.id,
                      Number(event.target.value),
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
        <label htmlFor={feedbackFieldId} className="text-sm font-semibold">
          Feedback for part {label}
        </label>
        <textarea
          id={feedbackFieldId}
          value={grade?.feedback ?? ""}
          placeholder="Explain what this part earned and what was missing."
          onChange={(event) => onFeedbackChange(event.target.value)}
          className="mt-2 min-h-[110px] w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none"
        />
      </div>
    </article>
  );
};

export default GradingPartCard;
