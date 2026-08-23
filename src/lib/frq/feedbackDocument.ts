import type { FRQFeedbackDocument } from "@/components/frq/feedback/types";
import type { FRQTemplate, GradedFRQSubmission } from "@/types/frq";
import type { Timestamp } from "firebase/firestore";
import { buildGradingQuestions } from "./gradingView.ts";
import { getAllParts, toQuestionInput } from "./template.ts";

const formatTimestamp = (value: Timestamp | undefined) => {
  if (!value || typeof value.toDate !== "function") {
    return "";
  }

  try {
    return value.toDate().toLocaleString();
  } catch {
    return "";
  }
};

/**
 * What names a question's page. A one-question exam keeps the template title,
 * because that is what every legacy document normalizes into and what those
 * pages have always printed; giving them a "Question 1" heading now would
 * reword an exam that is supposed to render unchanged. The title stays visible
 * on a multi-question exam through the footer, which prints it either way.
 */
const getQuestionName = (
  templateTitle: string,
  questionCount: number,
  questionIndex: number,
) => (questionCount > 1 ? `Question ${questionIndex + 1}` : templateTitle);

/**
 * Rebuild the rubric-shaped document the feedback UI renders from the two
 * things actually stored: the graded submission and the template it was graded
 * against. The renderer needs the full question/criterion tree, and only the
 * template has it — a graded submission stores just the awarded points, keyed
 * by the ids the template defines.
 */
export const buildFeedbackDocument = (
  graded: GradedFRQSubmission,
  template: FRQTemplate,
): FRQFeedbackDocument => {
  const grades = graded.grades ?? [];

  // The same grouping the grading page pages through, from the same function
  // on purpose: a student must be shown exactly the parts a grader was shown.
  // Deriving the two separately is how a rubric line nobody ever scored ends
  // up on a feedback page reading zero.
  const questions = buildGradingQuestions(template);

  return {
    name: template.title,
    creatorID: "",
    mostRecentEditor: graded.graderId,
    id: graded.sourceSubmissionId,
    isVisible: true,

    // Scores and responses stay one flat list keyed by part id rather than
    // being nested under questions. That is the shape they are stored in, and
    // the renderer looks every one of them up by id, so grouping the prompts
    // above changes what a page shows and nothing about how a grade resolves.
    feedback: {
      id: graded.sourceSubmissionId,
      graderId: graded.graderId,
      submittedAt: formatTimestamp(graded.gradedAt),
      questions: getAllParts(template).map((part) => {
        const partGrade = grades.find((grade) => grade.questionId === part.id);

        return {
          questionId: part.id,
          feedback: partGrade?.feedback ?? "",
          // Every criterion gets a row even when the grader left it at zero, so
          // the student sees the whole rubric rather than only what was earned.
          gradingCriteria: (part.criteria ?? []).map((criterion) => ({
            criterionId: criterion.id,
            points:
              partGrade?.criteria.find(
                (score) => score.criterionId === criterion.id,
              )?.points ?? 0,
          })),
        };
      }),
    },

    response: {
      id: graded.sourceSubmissionId,
      userId: graded.studentId,
      submittedAt: formatTimestamp(graded.submittedAt),
      answers: getAllParts(template).map((part) => ({
        questionId: part.id,
        value: graded.responses?.[part.id] ?? "",
      })),
    },

    // One entry per question, which is the level this array was always meant
    // to hold: it used to be hardcoded to a single entry carrying every part
    // in the exam, so a two-question FRQ printed both questions' parts on one
    // page under one stimulus.
    frqs: questions.map((question, index) => ({
      id: question.id,
      name: getQuestionName(template.title, questions.length, index),
      description: toQuestionInput(
        template.directions,
        template.directionsFiles,
      ),
      stimulus: toQuestionInput(question.stimulus, question.stimulusFiles),
      isVisible: true,
      questions: question.parts.map(({ part }) => ({
        id: part.id,
        name: part.title,
        isVisible: part.status !== "legacy",
        prompt: toQuestionInput(part.prompt, part.promptFiles),
        answerType: "text" as const,
        gradingCriteria: (part.criteria ?? []).map((criterion) => ({
          id: criterion.id,
          text: criterion.description,
          points: criterion.points,
        })),
      })),
    })),
  };
};
