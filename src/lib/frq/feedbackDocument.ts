import type { FRQFeedbackDocument } from "@/components/frq/feedback/types";
import type { FRQTemplate, GradedFRQSubmission } from "@/types/frq";
import type { Timestamp } from "firebase/firestore";
import { toQuestionInput } from "./template";

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

  return {
    name: template.title,
    creatorID: "",
    mostRecentEditor: graded.graderId,
    id: graded.sourceSubmissionId,
    isVisible: true,

    feedback: {
      id: graded.sourceSubmissionId,
      graderId: graded.graderId,
      submittedAt: formatTimestamp(graded.gradedAt),
      questions: template.questions.map((question) => {
        const partGrade = grades.find(
          (grade) => grade.questionId === question.id,
        );

        return {
          questionId: question.id,
          feedback: partGrade?.feedback ?? "",
          // Every criterion gets a row even when the grader left it at zero, so
          // the student sees the whole rubric rather than only what was earned.
          gradingCriteria: (question.criteria ?? []).map((criterion) => ({
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
      answers: template.questions.map((question) => ({
        questionId: question.id,
        value: graded.responses?.[question.id] ?? "",
      })),
    },

    frqs: [
      {
        id: template.id ?? graded.templateId,
        name: template.title,
        description: toQuestionInput(
          template.directions,
          template.directionsFiles,
        ),
        isVisible: true,
        questions: template.questions.map((question) => ({
          id: question.id,
          name: question.title,
          isVisible: question.status !== "legacy",
          prompt: toQuestionInput(question.prompt, question.promptFiles),
          answerType: "text" as const,
          gradingCriteria: (question.criteria ?? []).map((criterion) => ({
            id: criterion.id,
            text: criterion.description,
            points: criterion.points,
          })),
        })),
      },
    ],
  };
};
