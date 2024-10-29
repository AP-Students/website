import { type QuestionFormat } from '@/types/questions'
import clsx from 'clsx'

interface QuestionPanelProps {
  questionInstance: QuestionFormat | undefined
  selectedAnswers: string[]
  onSelectAnswer: (optionId: string) => void
}

function LetterCircle({ letter, checked }: { letter: string; checked: boolean }) {
  return (
    <span
      className={clsx(
        "flex size-7 items-center justify-center rounded-full border-2 border-black",
        {
          "bg-[#3075c1] text-white": checked,
        }
      )}
    >
      {letter}
    </span>
  )
}

export default function QuestionPanel({ 
  questionInstance,
  selectedAnswers,
  onSelectAnswer
}: QuestionPanelProps) {
  if (!questionInstance) return null

  return (
    <>
      <div className="my-4 text-lg">{questionInstance.question.value}</div>
      <ol className="grid gap-4">
        {questionInstance.options.map((option, index) => (
          <li key={option.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black p-2 has-[:checked]:-m-[3px] has-[:checked]:border-4 has-[:checked]:border-[#3075c1]">
              <LetterCircle
                letter={String.fromCharCode(65 + index)}
                checked={selectedAnswers.includes(option.id)}
              />
              <input
                type="radio"
                name="options"
                value={option.id}
                checked={selectedAnswers.includes(option.id)}
                onChange={() => onSelectAnswer(option.id)}
                hidden
              />
              {option.value.value}
            </label>
          </li>
        ))}
      </ol>
    </>
  )
}