"use client";

import AdvancedTextbox, {
  RICH_TEXT_SYNTAX_HINT,
} from "@/components/article-creator/custom_questions/AdvancedTextbox";
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
 * long after it began, so the array it hands back is stale.
 *
 * Giving every field its own one-entry array fixes the CROSS-FIELD half of
 * that: overwriting a sibling takes a sibling in the array, and here there is
 * never one. Nesting parts inside questions is therefore no more dangerous
 * than the flat editor was.
 *
 * It does NOT fix the within-field half, which AdvancedTextbox still has and
 * this component cannot reach. `updateQuestionsWithFiles` rebuilds the value
 * from the `questionInstance` its closure captured, so text typed while an
 * upload is in flight is reverted when that upload resolves. Closing it means
 * changing how AdvancedTextbox writes back, which every article-creator screen
 * also depends on. Do not read the isolation here as covering that case.
 */
const RichPromptEditor = ({
  value,
  onChange,
  placeholder,
}: RichPromptEditorProps) => {
  // Only to avoid handing a new array identity down on every render.
  // AdvancedTextbox's sync effect keys on `questions[qIndex]`, which is `value`
  // itself, so the array's identity is not what guards the text buffer.
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
      // The caller's sentence says which field this is; the shared hint says
      // what the field understands. Passing only the former is what made these
      // boxes read as plainer than the MCQ ones they are.
      placeholder={
        placeholder ? `${placeholder} ${RICH_TEXT_SYNTAX_HINT}` : undefined
      }
    />
  );
};

export default RichPromptEditor;
