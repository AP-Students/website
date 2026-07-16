"use client";

import ResponseInput, {
  type ResponseInputType,
} from "@/components/frq/responseInput";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FRQTestRendererProps = {
  frq: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
};

type MockAdvancedTextValue = {
  value: string;
  files: never[];
};

type MockFRQ = {
  title: string;
  description: MockAdvancedTextValue;
  question: MockAdvancedTextValue;
  explanation: MockAdvancedTextValue;
  options: never[];
  responseType: ResponseInputType;
};

const makeTextValue = (value: string): MockAdvancedTextValue => ({
  value,
  files: [],
});

const mockFRQs: MockFRQ[] = [
  {
    title: "Demographic Transition Model",
    description: makeTextValue(
      "Use the population pyramid and demographic transition model shown below to answer the questions.",
    ),
    question: makeTextValue(
      "Respond to parts A, B, C, D, E, F, and G. Refer to the population pyramid and the demographic transition model in your response.",
    ),
    explanation: makeTextValue(""),
    options: [],
    responseType: "rich-text",
  },
  {
    title: "Urban Land Use",
    description: makeTextValue(
      "Study the urban model and explain how land use changes across different parts of a city.",
    ),
    question: makeTextValue(
      "Respond to parts A, B, and C. Identify one pattern, explain one cause, and describe one effect.",
    ),
    explanation: makeTextValue(""),
    options: [],
    responseType: "rich-text",
  },
  {
    title: "Agricultural Regions",
    description: makeTextValue(
      "Use the map and information provided to analyze agricultural production patterns.",
    ),
    question: makeTextValue(
      "Respond to parts A, B, C, and D. Describe one region, explain one economic factor, and connect it to development.",
    ),
    explanation: makeTextValue(""),
    options: [],
    responseType: "rich-text",
  },
];

const FRQTestRenderer = ({
  frq,
  loading = false,
  error = null,
}: FRQTestRendererProps) => {
  const [currentFRQIndex, setCurrentFRQIndex] = useState(0);
  const [showQuestionNavigation, setShowQuestionNavigation] = useState(false);
  const [questions] = useState<MockFRQ[]>(mockFRQs);
  const [responses, setResponses] = useState<string[]>(
  mockFRQs.map(() => ""),
);
const [markedForReview, setMarkedForReview] = useState<
  Record<number, boolean>
>({});

const [timeRemaining, setTimeRemaining] = useState(
  1 * 60 * 60 + 30 * 60,
);
const [timerHidden, setTimerHidden] = useState(false);
const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
const [showReviewPage, setShowReviewPage] = useState(false);

useEffect(() => {
  const timer = window.setInterval(() => {
    setTimeRemaining((currentTime) =>
      currentTime > 0 ? currentTime - 1 : 0,
    );
  }, 1000);

  return () => {
    window.clearInterval(timer);
  };
}, []);

useEffect(() => {
  if (timeRemaining === 0) {
    setShowTimeUpPopup(true);
  }
}, [timeRemaining]);

const formattedTime = `${Math.floor(timeRemaining / 3600)}:${String(
  Math.floor((timeRemaining % 3600) / 60),
).padStart(2, "0")}:${String(timeRemaining % 60).padStart(2, "0")}`;

  const currentFRQ = questions[currentFRQIndex];
  const hasBackendData = Boolean(frq);

  const questionLabel = useMemo(
    () => `Question ${currentFRQIndex + 1} of ${questions.length}`,
    [currentFRQIndex, questions.length],
  );

  const handlePrevious = () => {
    setCurrentFRQIndex((currentIndex) =>
      currentIndex === 0 ? questions.length - 1 : currentIndex - 1,
    );
  };

  const handleNext = () => {
  if (currentFRQIndex === questions.length - 1) {
    setShowReviewPage(true);
    return;
  }

  setCurrentFRQIndex((currentIndex) => currentIndex + 1);
};

  if (loading) {
    return <p>Loading FRQ test...</p>;
  }

  if (error) {
    return <p>Failed to load FRQ test.</p>;
  }

  if (!currentFRQ) {
    return <p>FRQ test not found.</p>;
  }

  const timeUpModal = showTimeUpPopup ? (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="time-up-title"
  >
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 id="time-up-title" className="text-xl font-bold">
        Time is up
      </h2>

      <p className="mt-3 text-sm text-gray-600">
        Your time has ended. You can submit your test now or continue
        working.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className="rounded border border-gray-400 px-4 py-2 font-semibold"
          onClick={() => setShowTimeUpPopup(false)}
        >
          Continue Working
        </button>

        <button
          type="button"
          className="rounded bg-blue-700 px-4 py-2 font-semibold text-white"
          onClick={() => {
            setShowTimeUpPopup(false);
            window.alert(
              "Final submission will be connected later.",
            );
          }}
        >
          Submit Test
        </button>
      </div>
    </div>
  </div>
) : null;

  if (showReviewPage) {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-black">
      {timeUpModal}
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-4xl font-normal">
          Check Your Work
        </h1>

        <div className="mx-auto mt-10 max-w-3xl text-lg leading-8">
          <p>Review your responses before submitting your test.</p>

          <p className="mt-2">
            Select an FRQ number to return to that question.
          </p>
        </div>

        <section className="mt-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-300 pb-5">
            <h2 className="text-xl font-bold">
              Section II: Free-Response Questions
            </h2>

            <div className="flex flex-wrap gap-6 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 border-2 border-dashed border-gray-500" />
                Unanswered
              </span>

              <span className="flex items-center gap-2">
                <Bookmark
                  size={20}
                  fill="currentColor"
                  className="text-red-600"
                />
                For Review
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-5">
            {questions.map((question, index) => {
              const response = responses[index] ?? "";

              const isAnswered =
                response
                  .replace(/<[^>]*>/g, "")
                  .replace(/&nbsp;/g, " ")
                  .trim().length > 0;

              const isMarked =
                markedForReview[index] ?? false;

              return (
                <button
                  key={question.title}
                  type="button"
                  className={`relative mx-auto flex h-14 w-14 items-center justify-center text-xl font-bold ${
                    isAnswered
                      ? "bg-blue-700 text-white"
                      : "border-2 border-dashed border-gray-500 bg-white text-black"
                  }`}
                  onClick={() => {
                    setCurrentFRQIndex(index);
                    setShowReviewPage(false);
                  }}
                >
                  {index + 1}

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

          <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-gray-300 pt-6">
            <button
              type="button"
              className="rounded-full border border-blue-700 px-6 py-3 font-semibold text-blue-700"
              onClick={() => setShowReviewPage(false)}
            >
              Return to Test
            </button>

            <button
              type="button"
              className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white"
              onClick={() => {
                window.alert(
                  "Final submission will be connected later.",
                );
              }}
            >
              Submit Test
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-white p-4 text-black">
      {timeUpModal}
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col border-4 border-black">
        <header className="relative flex items-start justify-between px-6 py-3">
          <div>
            <p className="text-sm font-bold">Section I</p>
            <p className="text-xs">Directions ▾</p>
          </div>

          <div className="text-center">
  <p className="font-mono text-lg font-bold">
    {timerHidden ? "--:--:--" : formattedTime}
  </p>

  <button
    type="button"
    className="rounded border border-gray-400 px-2 py-0.5 text-xs"
    onClick={() => setTimerHidden((currentValue) => !currentValue)}
  >
    {timerHidden ? "Show" : "Hide"}
  </button>
</div>

          <button className="flex items-center gap-2 text-sm font-bold text-red-500">
  <LogOut size={16} />
  Exit Test
</button>

<div
  aria-hidden="true"
  className="absolute bottom-0 left-0 h-[2px] w-full"
  style={{
    backgroundImage:
      "repeating-linear-gradient(to right, #111 0 20px, transparent 20px 24px)",
  }}
/>
</header>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          <section className="border-b-2 border-solid border-gray-500 p-8 lg:border-b-0 lg:border-r-[3px]">
            <div className="mb-6 text-xs text-gray-600">
              {hasBackendData ? "FRQ data loaded" : "Using mock FRQ content"}
            </div>

            <div className="mb-8">
              <div className="mx-auto flex h-80 max-w-md items-end justify-center gap-1 border-l border-gray-300 border-b border-gray-300 px-6">
                {Array.from({ length: 17 }).map((_, index) => (
                  <div
                    key={`left-bar-${index}`}
                    className="bg-sky-500"
                    style={{
                      height: `${40 + Math.abs(8 - index) * 10}px`,
                      width: "10px",
                    }}
                  />
                ))}
                {Array.from({ length: 17 }).map((_, index) => (
                  <div
                    key={`right-bar-${index}`}
                    className="bg-pink-400"
                    style={{
                      height: `${40 + Math.abs(index - 8) * 10}px`,
                      width: "10px",
                    }}
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-sm">Figure 1</p>
              <p className="mt-2 text-xs italic">
                Source: populationpyramid.net
              </p>
            </div>

            <div className="mx-auto max-w-lg">
              <p className="mb-4 text-center text-sm font-bold">
                DEMOGRAPHIC TRANSITION MODEL
              </p>
              <div className="relative h-44 border border-gray-300">
                <div className="absolute left-6 right-6 top-12 h-0.5 bg-black" />
                <div className="absolute left-6 right-6 top-24 border-t-2 border-solid border-gray-500" />
                <div className="absolute left-6 top-10 h-20 w-72 rounded-br-full border-b-4 border-r-4 border-black" />
                <div className="absolute bottom-2 left-8 right-8 flex justify-between text-xs text-gray-600">
                  <span>Stage 1</span>
                  <span>Stage 2</span>
                  <span>Stage 3</span>
                  <span>Stage 4</span>
                  <span>Stage 5</span>
                </div>
              </div>
              <p className="mt-3 text-center text-sm">Figure 2</p>
            </div>


          </section>


          <section className="p-8">
          <div className="mb-6 w-full max-w-[50rem] bg-gray-100">
  <div className="flex h-8 items-center">
    <span className="flex h-8 w-8 items-center justify-center bg-black text-lg font-bold text-white">
      {currentFRQIndex + 1}
    </span>

    <button
      type="button"
      aria-pressed={markedForReview[currentFRQIndex] ?? false}
      className="flex h-full items-center gap-2 px-4 text-sm font-semibold"
      onClick={() => {
        setMarkedForReview((currentValues) => ({
          ...currentValues,
          [currentFRQIndex]:
            !(currentValues[currentFRQIndex] ?? false),
        }));
      }}
    >
      <Bookmark
        size={24}
        strokeWidth={2}
        fill={
          markedForReview[currentFRQIndex]
            ? "currentColor"
            : "none"
        }
        className={
          markedForReview[currentFRQIndex]
            ? "text-red-600"
            : "text-black"
        }
      />

      <span>Mark for Review</span>
    </button>
  </div>

  <div className="flex h-1 gap-1">
    <div className="flex-1 bg-blue-600" />
    <div className="flex-1 bg-red-300" />
    <div className="flex-1 bg-green-300" />
    <div className="flex-1 bg-emerald-300" />
    <div className="flex-1 bg-pink-300" />
    <div className="flex-1 bg-purple-500" />
    <div className="flex-1 bg-lime-300" />
    <div className="flex-1 bg-cyan-500" />
    <div className="flex-1 bg-indigo-400" />
    <div className="flex-1 bg-fuchsia-500" />
    <div className="flex-1 bg-teal-300" />
    <div className="flex-1 bg-orange-500" />
    <div className="flex-1 bg-red-500" />
    <div className="flex-1 bg-sky-400" />
    <div className="flex-1 bg-green-400" />
  </div>
</div>

            <p className="mb-4 text-sm">
              The <strong>{currentFRQ.title}</strong> can be used to theorize
              changes in a country&apos;s total population over time.
            </p>

            <ol className="mb-6 list-[upper-alpha] space-y-2 pl-6 text-sm leading-relaxed">
              <li>
                Identify the stage of the model that this country is most likely
                in.
              </li>
              <li>
                Explain one social cause of the transition between two stages.
              </li>
              <li>
                Define the term post-industrial society.
              </li>
              <li>
                Explain one change in the birth rate or death rate shown in the
                model.
              </li>
              <li>
                Describe how economic development can affect population growth.
              </li>
              <li>
                Explain one factor that may contribute to a country&apos;s aging
                population.
              </li>
              <li>
                Explain how migration may influence population trends.
              </li>
            </ol>

            <div className="rounded border border-gray-300 p-4">
              <ResponseInput
  type={currentFRQ.responseType}
  ariaLabel={`Response for FRQ ${currentFRQIndex + 1}`}
  value={responses[currentFRQIndex] ?? ""}
  onChange={(newResponse) => {
    setResponses((currentResponses) => {
      const updatedResponses = [...currentResponses];
      updatedResponses[currentFRQIndex] = newResponse;
      return updatedResponses;
    });
  }}
/>
            </div>
          </section>
        </div>

        <footer className="relative flex items-center justify-between px-6 py-3">
          <div
  aria-hidden="true"
  className="absolute left-0 top-0 h-[2px] w-full"
  style={{
    backgroundImage:
      "repeating-linear-gradient(to right, #111 0 20px, transparent 20px 24px)",
  }}
/>
          <p className="text-sm font-bold">AP Human Geography Practice Exam 1</p>

          <button
            className="rounded bg-black px-4 py-2 text-sm font-bold text-white"
            onClick={() => setShowQuestionNavigation((isOpen) => !isOpen)}
          >
            {questionLabel}
          </button>

          {showQuestionNavigation && (
  <div className="absolute bottom-14 left-1/2 z-30 w-[280px] -translate-x-1/2 rounded-md border border-gray-300 bg-white p-4 shadow-xl">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-bold">Navigate FRQs</p>

      <button
        type="button"
        aria-label="Close FRQ navigation"
        className="text-lg leading-none text-gray-500 hover:text-black"
        onClick={() => setShowQuestionNavigation(false)}
      >
        ×
      </button>
    </div>

    <div className="grid grid-cols-3 gap-3">
      {questions.map((question, questionIndex) => {
        const isCurrent = questionIndex === currentFRQIndex;
        const isMarked =
          markedForReview[questionIndex] ?? false;

        return (
          <button
            key={question.title}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            className={`relative h-12 rounded-sm border text-sm font-semibold transition ${
              isCurrent
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-gray-300 bg-white text-black hover:border-blue-600"
            }`}
            onClick={() => {
              setCurrentFRQIndex(questionIndex);
              setShowQuestionNavigation(false);
            }}
          >
            {questionIndex + 1}

            {isMarked && (
              <span
                aria-label="Marked for review"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600"
              />
            )}
          </button>
        );
      })}
    </div>

    <div className="mt-4 flex items-center gap-4 border-t border-gray-200 pt-3 text-xs text-gray-600">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 bg-blue-700" />
        Current
      </span>

      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-600" />
        Marked
      </span>
    </div>

    <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-gray-300 bg-white" />
  </div>
)}

          <div className="flex gap-3">
            <button
              className="flex items-center gap-1 rounded-full bg-[#294ad1] px-5 py-2 text-sm font-bold text-white hover:bg-[#2a47bb]"
              onClick={handlePrevious}
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              className="flex items-center gap-1 rounded-full bg-[#294ad1] px-5 py-2 text-sm font-bold text-white hover:bg-[#2a47bb]"
              onClick={handleNext}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default FRQTestRenderer;