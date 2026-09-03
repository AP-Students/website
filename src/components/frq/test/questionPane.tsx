"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import FRQResponseEditor from "@/components/frq/responseEditor";
import type { StudentQuestion } from "@/lib/frq/studentView";
import { toQuestionInput } from "@/lib/frq/template";
import type { QuestionFile } from "@/types/questions";
import { Bookmark } from "lucide-react";
import { memo } from "react";

/**
 * A page now stacks every part of a question, so an unmemoized prompt would
 * re-run KaTeX rendering and rich-text sanitization for every other part on
 * the page each time a keystroke in any one part's response box re-renders
 * `QuestionPane`. Memoized on the prompt's own text and files so it only
 * re-renders when its own content actually changes.
 */
const PartPrompt = memo(
  ({ prompt, promptFiles }: { prompt?: string; promptFiles?: QuestionFile[] }) => (
    <RenderContent
      content={toQuestionInput(prompt, promptFiles)}
      origin="question"
    />
  ),
);
PartPrompt.displayName = "PartPrompt";

/**
 * DOM id of one part's block. The footer's part shortcuts and the review grid
 * scroll to these, which is how a student still reaches an individual part now
 * that a page holds all of a question's parts at once.
 *
 * Read back with `getElementById` rather than `querySelector`, because a part
 * id comes from Firestore and may contain characters that need escaping in a
 * CSS selector but are fine in an id lookup.
 */
export const getPartAnchorId = (partId: string) => `frq-part-${partId}`;

type QuestionPaneProps = {
  question: StudentQuestion;
  responses: Record<string, string>;
  markedForReview: Record<string, boolean>;
  onResponseChange: (partId: string, value: string) => void;
  onToggleMark: (partId: string) => void;
};

/** Every part of the open question, stacked, each with its own response box. */
const QuestionPane = ({
  question,
  responses,
  markedForReview,
  onResponseChange,
  onToggleMark,
}: QuestionPaneProps) => (
  <div className="space-y-12">
    {question.parts.map(({ part, label }) => {
      const isMarked = markedForReview[part.id] ?? false;

      return (
        <article
          key={part.id}
          id={getPartAnchorId(part.id)}
          // Leaves room above the block so a scrolled-to part is not flush
          // against the top edge of the scrolling pane.
          className="scroll-mt-6"
        >
          <div className="mb-6 w-full max-w-[50rem] bg-gray-100">
            <div className="flex h-8 items-center">
              <span className="flex h-8 w-8 items-center justify-center bg-black text-lg font-bold text-white">
                {label}
              </span>

              <button
                type="button"
                aria-pressed={isMarked}
                className="flex h-full items-center gap-2 px-4 text-sm font-semibold"
                onClick={() => onToggleMark(part.id)}
              >
                <Bookmark
                  size={24}
                  strokeWidth={2}
                  fill={isMarked ? "currentColor" : "none"}
                  className={isMarked ? "text-red-600" : "text-black"}
                />

                <span>Mark for Review</span>
              </button>
            </div>
          </div>

          <div className="mb-4 font-sans text-sm">
            <PartPrompt prompt={part.prompt} promptFiles={part.promptFiles} />
          </div>

          <div className="w-full max-w-[50rem]">
            <FRQResponseEditor
              ariaLabel={`Response for part ${label}`}
              value={responses[part.id] ?? ""}
              onChange={(newResponse) => onResponseChange(part.id, newResponse)}
            />
          </div>
        </article>
      );
    })}
  </div>
);

export default QuestionPane;
