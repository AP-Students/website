"use client";

import AdvancedTextbox from "@/components/article-creator/custom_questions/AdvancedTextbox";
import type { QuestionFormat } from "@/types/questions";
import { useMemo } from "react";

interface RichPromptEditorProps {
  value: QuestionFormat;
  onChange: (value: QuestionFormat) => void;
  placeholder?: string;
}

/**
 * One rich-text field, isolated from every other one on the page.
 *
 * AdvancedTextbox is written for a single flat array of questions: it reads
 * `questions[qIndex]` and hands the whole array back on every change, rebuilt
 * from the array it captured when that change started. A file upload finishes
 * long after it began, so the array it hands back is stale, and writing all of
 * it back would undo edits made to the other entries meanwhile.
 *
 * Giving every field its own one-entry array removes the hazard rather than
 * working around it: overwriting a sibling requires a sibling to be in the
 * array, and here there is never one. That is what makes nesting parts inside
 * questions safe, instead of doubling a hazard the flat editor already had.
 */
const RichPromptEditor = ({
  value,
  onChange,
  placeholder,
}: RichPromptEditorProps) => {
  // Identity has to survive unrelated re-renders. AdvancedTextbox re-seeds its
  // local text buffer from this entry in an effect keyed on it, so handing it a
  // freshly built array every render would reset the buffer mid-edit.
  const questions = useMemo(() => [value], [value]);

  return (
    <AdvancedTextbox
      questions={questions}
      setQuestions={(updated) => {
        const next = updated[0];

        if (next) {
          onChange(next);
        }
      }}
      origin="question"
      qIndex={0}
      placeholder={placeholder}
    />
  );
};

export default RichPromptEditor;
