"use client";

import AdvancedTextbox, {
  RICH_TEXT_SYNTAX_HINT,
} from "@/components/article-creator/custom_questions/AdvancedTextbox";
import type { QuestionFormat, QuestionInput } from "@/types/questions";
import { useMemo } from "react";

interface RichContentEditorProps {
  value: QuestionInput;
  onChange: (value: QuestionInput) => void;
  placeholder?: string;
}

const EMPTY_QUESTION_FORMAT: Omit<QuestionFormat, "question"> = {
  type: "frq",
  options: [],
  answers: [],
  explanation: { value: "", files: [] },
  content: { value: "", files: [] },
  topic: "",
};

/**
 * `AdvancedTextbox` reads and writes a `QuestionFormat`, not a bare
 * `QuestionInput`. This wraps one `QuestionInput` in a throwaway
 * single-question array the same way `RichPromptEditor` does, so any
 * `QuestionInput`-shaped field (not just `QuestionFormat.question`) can reuse
 * the same rich text/KaTeX/file-upload editor.
 */
const RichContentEditor = ({
  value,
  onChange,
  placeholder,
}: RichContentEditorProps) => {
  const questions = useMemo(
    () => [{ ...EMPTY_QUESTION_FORMAT, question: value }],
    [value],
  );

  return (
    <AdvancedTextbox
      questions={questions}
      setQuestions={(updated) => {
        const next = updated[0];

        if (next) {
          onChange(next.question);
        }
      }}
      origin="question"
      qIndex={0}
      placeholder={
        placeholder ? `${placeholder} ${RICH_TEXT_SYNTAX_HINT}` : undefined
      }
    />
  );
};

export default RichContentEditor;
