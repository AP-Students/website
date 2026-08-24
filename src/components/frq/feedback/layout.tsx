import Header from "./header";
import Footer from "@/components/frq/FRQFooter";
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

  return (
    <div className="min-h-screen bg-white text-black">
      <Header earnedPoints={earnedPoints} totalPoints={totalPoints} />

      <main className="grid h-screen grid-cols-2 pb-14 pt-16">
        <div className="overflow-y-auto border-r-2 border-gray-500">
          <LeftSide
            description={currentFrq.description}
            stimulus={currentFrq.stimulus}
          />

          {overallFeedback?.trim() && (
            <div className="mx-8 mb-8 rounded-md border border-gray-400 p-4">
              <h2 className="mb-2 font-bold">Overall feedback</h2>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {overallFeedback}
              </p>
            </div>
          )}
        </div>

        <QuestionFeedback
          frq={currentFrq}
          questionCount={feedbackData.frqs.length}
          questionIndex={currentFrqIndex}
          feedbackData={feedbackData}
          readOnly={readOnly}
          onFeedbackChange={onFeedbackChange}
          onPointsChange={onPointsChange}
        />
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
