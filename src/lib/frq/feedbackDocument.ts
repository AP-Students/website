import type { FRQFeedbackDocument } from "@/components/frq/feedback/types";
import type { FRQTemplate, GradedFRQSubmission } from "@/types/frq";
import type { Timestamp } from "firebase/firestore";
import { getAllParts, toQuestionInput } from "./template";

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
      questions: getAllParts(template).map((part) => {
        const partGrade = grades.find(
          (grade) => grade.questionId === part.id,
        );

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

    frqs: [
      {
        id: template.id ?? graded.templateId,
        name: template.title,
        description: toQuestionInput(
          template.directions,
          template.directionsFiles,
        ),
        isVisible: true,
        questions: getAllParts(template).map((part) => ({
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
      },
    ],
  };
};
