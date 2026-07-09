"use client";

import AdvancedTextbox from "@/components/article-creator/custom_questions/AdvancedTextbox";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useMemo, useState } from "react";

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
  },
];

const FRQTestRenderer = ({
  frq,
  loading = false,
  error = null,
}: FRQTestRendererProps) => {
  const [currentFRQIndex, setCurrentFRQIndex] = useState(0);
  const [showQuestionNavigation, setShowQuestionNavigation] = useState(false);
  const [questions, setQuestions] = useState<MockFRQ[]>(mockFRQs);

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
    setCurrentFRQIndex((currentIndex) =>
      currentIndex === questions.length - 1 ? 0 : currentIndex + 1,
    );
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

  return (
    <main className="min-h-screen bg-white p-4 text-black">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col border-4 border-black">
        <header className="flex items-start justify-between border-b-2 border-dashed border-gray-500 px-6 py-3">
          <div>
            <p className="text-sm font-bold">Section II</p>
            <p className="text-xs">Directions ▾</p>
          </div>

          <div className="text-center">
            <p className="font-mono text-lg font-bold">1:13:26</p>
            <button className="rounded border border-gray-400 px-2 py-0.5 text-xs">
              Hide
            </button>
          </div>

          <button className="flex items-center gap-2 text-sm font-bold text-red-500">
            <LogOut size={16} />
            Exit Test
          </button>
        </header>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          <section className="border-b-2 border-dashed border-gray-500 p-8 lg:border-b-0 lg:border-r-2">
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
                <div className="absolute left-6 right-6 top-24 border-t-2 border-dashed border-gray-500" />
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

            <div className="mt-8 rounded border border-gray-300 p-4">
              <AdvancedTextbox
                questions={questions}
                setQuestions={setQuestions}
                origin="content"
                qIndex={currentFRQIndex}
                placeholder="Write your FRQ response here"
              />
            </div>
          </section>

          <section className="p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center bg-black text-sm font-bold text-white">
                {currentFRQIndex + 1}
              </span>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" />
                Mark for Review
              </label>
            </div>

            <div className="mb-4 flex h-2 max-w-md overflow-hidden rounded">
              <div className="flex-1 bg-blue-500" />
              <div className="flex-1 bg-purple-500" />
              <div className="flex-1 bg-pink-500" />
              <div className="flex-1 bg-yellow-400" />
              <div className="flex-1 bg-green-400" />
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
              <AdvancedTextbox
                questions={questions}
                setQuestions={setQuestions}
                origin="question"
                qIndex={currentFRQIndex}
                placeholder="Write your FRQ response here"
              />
            </div>
          </section>
        </div>

        <footer className="relative flex items-center justify-between border-t-2 border-dashed border-gray-500 px-6 py-3">
          <p className="text-sm font-bold">AP Human Geography Practice Exam 1</p>

          <button
            className="rounded bg-black px-4 py-2 text-sm font-bold text-white"
            onClick={() => setShowQuestionNavigation((isOpen) => !isOpen)}
          >
            {questionLabel}
          </button>

          {showQuestionNavigation && (
            <div className="absolute bottom-16 left-1/2 z-10 w-56 -translate-x-1/2 rounded border border-gray-300 bg-white p-3 shadow-lg">
              <p className="mb-3 text-sm font-bold">Navigate FRQs</p>
              <div className="grid grid-cols-3 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.title}
                    className={`rounded border px-3 py-2 text-sm ${
                      index === currentFRQIndex
                        ? "bg-[#294ad1] text-white"
                        : "bg-white text-black"
                    }`}
                    onClick={() => {
                      setCurrentFRQIndex(index);
                      setShowQuestionNavigation(false);
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
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