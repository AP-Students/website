"use client";

import FRQResponseEditor from "@/components/frq/responseEditor";

export type ResponseInputType =
  | "rich-text"
  | "short-text"
  | "number"
  | "multiple-choice";

type ResponseOption = {
  label: string;
  value: string;
};

type ResponseInputProps = {
  type: ResponseInputType;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  options?: ResponseOption[];
};

const ResponseInput = ({
  type,
  value,
  onChange,
  ariaLabel,
  options = [],
}: ResponseInputProps) => {
  switch (type) {
    case "rich-text":
      return (
        <FRQResponseEditor
          value={value}
          onChange={onChange}
          ariaLabel={ariaLabel}
        />
      );

    case "short-text":
      return (
        <textarea
          aria-label={ariaLabel}
          className="min-h-32 w-full resize-y border border-gray-400 p-3 text-sm outline-none focus:border-blue-600"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          aria-label={ariaLabel}
          className="w-full border border-gray-400 p-3 text-sm outline-none focus:border-blue-600"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "multiple-choice":
      return (
        <div className="space-y-3" role="radiogroup" aria-label={ariaLabel}>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded border border-gray-300 p-3"
            >
              <input
                type="radio"
                name={ariaLabel}
                value={option.value}
                checked={value === option.value}
                onChange={(event) => onChange(event.target.value)}
              />

              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );

    default:
      return null;
  }
};

export default ResponseInput;