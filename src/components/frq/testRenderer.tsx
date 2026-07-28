"use client";

import FRQResponseEditor from "@/components/frq/responseEditor";
import FRQFooter from "@/components/frq/FRQFooter";
import { Bookmark, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/components/hooks/UserContext";

type FRQTestRendererProps = {
  frq: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
};

type FRQQuestion = {
  id: string;
  title: string;
};

const mockFRQs: FRQQuestion[] = [
  { id: "mock-demographic-transition", title: "Demographic Transition Model" },
  { id: "mock-urban-land-use", title: "Urban Land Use" },
  { id: "mock-agricultural-regions", title: "Agricultural Regions" },
];
const emptyQuestions: FRQQuestion[] = [];

const isTemplateQuestion = (value: unknown): value is FRQQuestion =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as FRQQuestion).id === "string" &&
  typeof (value as FRQQuestion).title === "string";

const FRQTestRenderer = ({
  frq,
  loading = false,
  error = null,
}: FRQTestRendererProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [currentFRQIndex, setCurrentFRQIndex] = useState(0);
  const templateQuestions = useMemo<FRQQuestion[] | null>(
    () => (Array.isArray(frq?.questions) ? frq.questions : null),
    [frq],
  );
  const hasInvalidTemplateQuestions =
    templateQuestions !== null &&
    (templateQuestions.length === 0 ||
      !templateQuestions.every(isTemplateQuestion));
  const questions = hasInvalidTemplateQuestions
    ? emptyQuestions
    : (templateQuestions ?? mockFRQs);
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    setResponses((currentResponses) =>
      Object.fromEntries(
        questions.map((question) => [
          question.id,
          currentResponses[question.id] ?? "",
        ]),
      ),
    );
    setCurrentFRQIndex(0);
  }, [questions]);
  const [markedForReview, setMarkedForReview] = useState<
    Record<number, boolean>
  >({});

  const [timeRemaining, setTimeRemaining] = useState(1 * 60 * 60 + 30 * 60);
  const [timerHidden, setTimerHidden] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

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

  if (hasInvalidTemplateQuestions) {
    return <p>This FRQ template has invalid question identifiers.</p>;
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
          Your time has ended. You can submit your test now or continue working.
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
              window.alert("Final submission will be connected later.");
            }}
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  ) : null;
  const downloadResponsesAsPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      window.alert(
        "The browser blocked the PDF window. Allow pop-ups and try again.",
      );
      return;
    }

    const getPlainText = (html: string) => {
      const parsedDocument = new DOMParser().parseFromString(html, "text/html");

      return parsedDocument.body.textContent?.trim() || "No response";
    };

    const printDocument = printWindow.document;

    printDocument.title = "FRQ Responses";
    printDocument.head.replaceChildren();
    printDocument.body.replaceChildren();

    const styleElement = printDocument.createElement("style");

    styleElement.textContent = `
    body {
      margin: 40px;
      color: #111;
      font-family: Georgia, "Times New Roman", serif;
    }

    h1 {
      margin-bottom: 32px;
      text-align: center;
    }

    .response {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .response h2 {
      border-bottom: 1px solid #999;
      padding-bottom: 8px;
      font-size: 18px;
    }

    .response p {
      white-space: pre-wrap;
      line-height: 1.6;
    }
  `;

    printDocument.head.appendChild(styleElement);

    const pageTitle = printDocument.createElement("h1");
    pageTitle.textContent = "AP Human Geography FRQ Responses";
    printDocument.body.appendChild(pageTitle);

    questions.forEach((question, index) => {
      const section = printDocument.createElement("section");
      section.className = "response";

      const heading = printDocument.createElement("h2");
      heading.textContent = `FRQ ${index + 1}: ${question.title}`;

      const responseText = printDocument.createElement("p");
      responseText.textContent = getPlainText(responses[question.id] ?? "");

      section.append(heading, responseText);
      printDocument.body.appendChild(section);
    });

    printWindow.focus();

    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const submitForGrading = async () => {
    const templateId = typeof frq?.id === "string" ? frq.id : null;

    if (!user || !templateId) {
      window.alert("Please sign in before submitting this FRQ for grading.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "gradableFrqSubmissions"), {
        templateId,
        studentId: user.uid,
        responses,
        submittedAt: serverTimestamp(),
      });
      setShowSubmissionModal(false);
      window.alert("Your FRQ was submitted for grading.");
    } catch (submissionError) {
      console.error("Error submitting FRQ for grading:", submissionError);
      window.alert("We could not submit your FRQ. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submissionModal = showSubmissionModal ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-title"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <button
          type="button"
          aria-label="Close submission popup"
          className="absolute right-4 top-3 text-2xl text-gray-500 hover:text-black"
          onClick={() => setShowSubmissionModal(false)}
        >
          ×
        </button>

        <h2 id="submission-title" className="text-2xl font-bold">
          Submit Your Test
        </h2>

        <p className="mt-3 text-sm text-gray-600">
          Download a copy of your responses or submit them for grading.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="rounded border border-blue-700 px-5 py-3 font-semibold text-blue-700"
            onClick={downloadResponsesAsPdf}
          >
            Download Responses as PDF
          </button>

          <button
            type="button"
            className="rounded bg-blue-700 px-5 py-3 font-semibold text-white"
            onClick={() => void submitForGrading()}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit for Grading"}
          </button>

          <button
            type="button"
            className="rounded border border-black px-5 py-3 font-semibold text-black hover:bg-gray-100"
            onClick={() => setShowSubmissionModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (showReviewPage) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12 text-black">
        {timeUpModal}
        {submissionModal}
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center text-4xl font-normal">Check Your Work</h1>

          <div className="mx-auto mt-6 max-w-2xl space-y-0.5 text-center text-base leading-5">
            <p>Review your responses before submitting your test.</p>
            <p>Select an FRQ number to return to that question.</p>
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

            <div className="mt-8 flex flex-wrap items-center justify-start gap-10 py-6 pl-6">
              {questions.map((question, index) => {
                const response = responses[question.id] ?? "";

                const isAnswered =
                  response
                    .replace(/<[^>]*>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .trim().length > 0;

                const isMarked = markedForReview[index] ?? false;

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`relative flex h-14 w-14 items-center justify-center text-xl font-bold ${
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
                onClick={() => setShowSubmissionModal(true)}
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
    <main className="min-h-screen w-full bg-white text-black">
      {timeUpModal}
      <section className="flex min-h-screen w-full flex-col border-4 border-black">
        <header className="relative flex items-start justify-between px-6 py-3">
          <div>
            <p className="text-sm font-bold">Section I</p>
            <p className="text-xs">Directions ▾</p>
          </div>

          <div className="text-center">
            <p className="font-sans text-lg font-bold">
              {timerHidden ? "" : formattedTime}
            </p>

            <button
              type="button"
              className="rounded border border-gray-400 px-2 py-0.5 text-xs"
              onClick={() => setTimerHidden((currentValue) => !currentValue)}
            >
              {timerHidden ? "Show" : "Hide"}
            </button>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 text-sm font-bold text-red-500"
            onClick={() => router.back()}
          >
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
              <div className="mx-auto flex h-80 max-w-md items-end justify-center gap-1 border-b border-l border-gray-300 border-gray-300 px-6">
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
                      [currentFRQIndex]: !(
                        currentValues[currentFRQIndex] ?? false
                      ),
                    }));
                  }}
                >
                  <Bookmark
                    size={24}
                    strokeWidth={2}
                    fill={
                      markedForReview[currentFRQIndex] ? "currentColor" : "none"
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

              <div className="flex h-1 w-full gap-1">
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

            <p className="mb-4 font-sans text-sm">
              The <strong>{currentFRQ.title}</strong> can be used to theorize
              changes in a country&apos;s total population over time.
            </p>

            <ol className="mb-6 list-[upper-alpha] space-y-2 pl-6 font-sans text-sm leading-relaxed">
              <li>
                Identify the stage of the model that this country is most likely
                in.
              </li>
              <li>
                Explain one social cause of the transition between two stages.
              </li>
              <li>Define the term post-industrial society.</li>
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
              <li>Explain how migration may influence population trends.</li>
            </ol>

            <div className="w-full max-w-[50rem]">
              <FRQResponseEditor
                ariaLabel={`Response for FRQ ${currentFRQIndex + 1}`}
                value={responses[currentFRQ.id] ?? ""}
                onChange={(newResponse) => {
                  setResponses((currentResponses) => {
                    return {
                      ...currentResponses,
                      [currentFRQ.id]: newResponse,
                    };
                  });
                }}
              />
            </div>
          </section>
        </div>

        <FRQFooter
          testName="AP Human Geography Practice Exam 1"
          currentFrqIndex={currentFRQIndex}
          totalFrqs={questions.length}
          onPrevious={() => {
            setCurrentFRQIndex((currentIndex) => Math.max(currentIndex - 1, 0));
          }}
          onNext={handleNext}
          onJumpToFrq={(index) => {
            setCurrentFRQIndex(index);
            setShowReviewPage(false);
          }}
        />
      </section>
    </main>
  );
};

export default FRQTestRenderer;
