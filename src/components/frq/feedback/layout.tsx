import Header from "./header";
import Footer from "@/components/frq/FRQFooter";
import { hasVisibleContent } from "@/lib/frq/studentView";
import { cn } from "@/lib/utils";
import LeftSide from "./leftSide";
import QuestionFeedback from "./rightSide";
import type { FRQFeedbackDocument, FRQQuestion } from "./types";

interface LayoutProps {
  feedbackData: FRQFeedbackDocument;
  currentFrq: FRQQuestion;
  currentFrqIndex: number;
  readOnly?: boolean;
  overallFeedback?: string;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToFrq: (index: number) => void;
  onFeedbackChange: (questionId: string, feedback: string) => void;
  onPointsChange: (
    questionId: string,
    criterionId: string,
    points: number,
  ) => void;
}

export default function Layout({
  feedbackData,
  currentFrq,
  currentFrqIndex,
  readOnly = false,
  overallFeedback,
  onPrevious,
  onNext,
  onJumpToFrq,
  onFeedbackChange,
  onPointsChange,
}: LayoutProps) {
  const earnedPoints = feedbackData.feedback.questions.reduce(
    (feedbackTotal, partFeedback) =>
      feedbackTotal +
      partFeedback.gradingCriteria.reduce(
        (partTotal, criterionScore) => partTotal + criterionScore.points,
        0,
      ),
    0,
  );

  const totalPoints = feedbackData.frqs.reduce(
    (frqTotal, frq) =>
      frqTotal +
      frq.questions.reduce(
        (partTotal, part) =>
          partTotal +
          part.gradingCriteria.reduce(
            (criterionTotal, criterion) => criterionTotal + criterion.points,
            0,
          ),
        0,
      ),
    0,
  );

  const { directionsPlacement } = feedbackData;

  // `normalizeFrqTemplate` stores an unauthored stimulus as "", and a cleared
  // editor leaves markup with no text in it, so being present is not enough.
  const stimulus =
    currentFrq.stimulus &&
    hasVisibleContent(currentFrq.stimulus.value, currentFrq.stimulus.files)
      ? currentFrq.stimulus
      : undefined;
  const paneDirections =
    directionsPlacement === "pane" ? currentFrq.description : undefined;
  const hasPaneContent = paneDirections !== undefined || stimulus !== undefined;
  const hasOverallFeedback = Boolean(overallFeedback?.trim());

  // A question with nothing to read beside it gets one column, as on the test
  // page, rather than a blank half-screen where the directions used to sit.
  const hasLeftPane = hasPaneContent || hasOverallFeedback;

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        earnedPoints={earnedPoints}
        totalPoints={totalPoints}
        directions={
          directionsPlacement === "header" ? currentFrq.description : undefined
        }
      />

      <main
        className={cn(
          "grid h-screen pb-14 pt-16",
          hasLeftPane ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {hasLeftPane && (
          <div className="overflow-y-auto border-r-2 border-gray-500">
            {hasPaneContent && (
              <LeftSide directions={paneDirections} stimulus={stimulus} />
            )}

            {hasOverallFeedback && (
              <div className="mx-8 mb-8 rounded-md border border-gray-400 p-4">
                <h2 className="mb-2 font-bold">Overall feedback</h2>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {overallFeedback}
                </p>
              </div>
            )}
          </div>
        )}

        <div
          className={cn("min-h-0", !hasLeftPane && "mx-auto w-full max-w-4xl")}
        >
          <QuestionFeedback
            frq={currentFrq}
            questionCount={feedbackData.frqs.length}
            questionIndex={currentFrqIndex}
            feedbackData={feedbackData}
            readOnly={readOnly}
            onFeedbackChange={onFeedbackChange}
            onPointsChange={onPointsChange}
          />
        </div>
      </main>

      <Footer
        testName={feedbackData.name}
        currentFrqIndex={currentFrqIndex}
        totalFrqs={feedbackData.frqs.length}
        onPrevious={onPrevious}
        onNext={onNext}
        onJumpToFrq={onJumpToFrq}
      />
    </div>
  );
}
