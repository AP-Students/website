import React, { useState } from "react";
import clsx from "clsx";

interface QuestionPanelProps {
  question: string;
  options: string[];
  attachments: any[];
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

const QuestionPanel: React.FC<QuestionPanelProps> = ({ question, options }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  return (
    <>
      <div className="mb-4 text-lg">{question}</div>
      <ol className="grid gap-4">
        {options.map((option, index) => (
          <li key={index}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black p-2 has-[:checked]:-m-[4px] has-[:checked]:border-4 has-[:checked]:border-[#3075c1]">
              <LetterCircle
                letter={String.fromCharCode(65 + index)}
                checked={selectedOption === option}
              />
              <input
                type="radio"
                id={`option-${index}`}
                name="options"
                value={option}
                checked={selectedOption === option}
                onChange={handleOptionChange}
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
