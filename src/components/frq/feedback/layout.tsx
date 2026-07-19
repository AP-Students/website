import Header from "./header";
import Footer from "./footer";
import LeftSide from "./leftSide";
import QuestionFeedback from "./rightSide";
import type {
  FRQFeedbackDocument,
  FRQQuestion,
} from "./types";

interface LayoutProps {
  feedbackData: FRQFeedbackDocument;
  currentFrq: FRQQuestion;
  currentFrqIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToFrq: (index: number) => void;
  onFeedbackChange: (questionId: string, feedback: string) => void;
  onPointsChange: (questionId: string, criterionId: string, points: number)=> void;
}

export default function Layout({
  feedbackData,
  currentFrq,
  currentFrqIndex,
  onPrevious,
  onNext,
  onJumpToFrq,
  onFeedbackChange,
  onPointsChange,
}: LayoutProps) {
  const earnedPoints =
    feedbackData.feedback.questions.reduce(
      (feedbackTotal, partFeedback) =>
        feedbackTotal +
        partFeedback.gradingCriteria.reduce(
          (partTotal, criterionScore) =>
            partTotal + criterionScore.points,
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
            (criterionTotal, criterion) =>
              criterionTotal + criterion.points,
            0,
          ),
        0,
      ),
    0,
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        earnedPoints={earnedPoints}
        totalPoints={totalPoints}
      />

      <main className="grid h-screen grid-cols-2 pt-16 pb-14">
        <div className="border-r-2 border-gray-400">
          <LeftSide description={currentFrq.description} />
        </div>

        <QuestionFeedback
          frq={currentFrq}
          feedbackData={feedbackData}
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