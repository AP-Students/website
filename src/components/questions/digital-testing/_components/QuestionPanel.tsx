import React from "react";
import clsx from "clsx";
import type { Question } from "../testRenderer";

interface QuestionPanelProps {
  question: Question;
  attachments: any[];
  saveSelection: (selected: number | null) => void;
}

function LetterCircle({
  letter,
  checked,
}: {
  letter: string;
  checked: boolean;
}) {
  return (
    <span
      className={clsx(
        "flex size-7 items-center justify-center rounded-full border-2 border-black",
        {
          "bg-[#3075c1] text-white": checked,
        },
      )}
    >
      {letter}
    </span>
  );
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  saveSelection,
}) => {
  return (
    <>
      <div className="my-4 text-lg">{question.statement}</div>
      <ol className="grid gap-4">
        {question.options.map((option, index) => (
          <li key={index}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black p-2 has-[:checked]:-m-[3px] has-[:checked]:border-4 has-[:checked]:border-[#3075c1]">
              <LetterCircle
                letter={String.fromCharCode(65 + index)}
                checked={question.selected === index}
              />
              <input
                type="radio"
                id={`option-${index}`}
                name="options"
                value={option}
                checked={question.selected === index}
                onChange={() => saveSelection(index)}
                hidden
              />
              {option}
            </label>
          </li>
        ))}
      </ol>
    </>
  );
};

export default QuestionPanel;
