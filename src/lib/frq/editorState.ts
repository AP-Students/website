import type {
  FRQAnswerType,
  FRQGradingCriterion,
  FRQQuestionStatus,
  FRQTemplate,
  FRQTemplatePart,
  FRQTemplateQuestion,
} from "@/types/frq";
import type { QuestionFormat, QuestionInput } from "@/types/questions";
import {
  DEFAULT_TIME_LIMIT_MINUTES,
  getPartLabel,
  getPartPoints,
  makeId,
  toQuestionInput,
} from "./template.ts";

/**
 * The editor's own state shape, kept apart from the React component so the
 * save format and the reordering rules can be tested directly. The round-trip
 * suite used to re-implement `buildTemplatePayload` by hand to reach it, which
 * meant the test could keep passing after the real save format drifted.
 */

/** One part as the editor holds it: stored fields plus its rich-text buffer. */
export interface EditorPart {
  id: string;
  /** Prompt text and files, in the shape AdvancedTextbox reads and writes. */
  prompt: QuestionFormat;
  status: FRQQuestionStatus;
  answerType: FRQAnswerType;
  criteria: FRQGradingCriterion[];
}

/** One numbered question: its own stimulus plus the parts hanging off it. */
export interface EditorQuestion {
  id: string;
  /** Stimulus text and files, same rich-text shape as a part's prompt. */
  stimulus: QuestionFormat;
  parts: EditorPart[];
}

export interface EditorState {
  title: string;
  /** Exam-wide directions. Stays separate from any one question's stimulus. */
  description: QuestionFormat;
  sectionLabel: string;
  sectionSubtitle: string;
  questions: EditorQuestion[];
  timeLimitMinutes: number;
  isPublic: boolean;
}

const createQuestionInput = (value = ""): QuestionInput => ({
  value,
  files: [],
});

/**
 * AdvancedTextbox only ever reads `question` here, but it spreads the whole
 * record on every edit, so the unused fields have to exist to survive a save.
 */
const createQuestionData = (
  question = createQuestionInput(),
): QuestionFormat => ({
  question,
  type: "frq",
  options: [],
  answers: [],
  explanation: createQuestionInput(),
  content: createQuestionInput(),
  topic: "",
});

export const createEditorPart = (): EditorPart => ({
  id: makeId("part"),
  prompt: createQuestionData(),
  status: "public",
  answerType: "text",
  criteria: [],
});

/**
 * A new question starts with no parts. The author adds the first one, which
 * keeps a half-built question out of the saved document: `getStudentFacing-
 * Questions` drops a question whose parts are all hidden anyway.
 */
export const createEditorQuestion = (): EditorQuestion => ({
  id: makeId("question"),
  stimulus: createQuestionData(),
  parts: [],
});

const toEditorPart = (part: FRQTemplatePart): EditorPart => ({
  id: part.id,
  prompt: createQuestionData(toQuestionInput(part.prompt, part.promptFiles)),
  status: part.status ?? "public",
  answerType: part.answerType ?? "text",
  criteria: part.criteria ?? [],
});

const toEditorQuestion = (question: FRQTemplateQuestion): EditorQuestion => ({
  id: question.id,
  stimulus: createQuestionData(
    toQuestionInput(question.stimulus, question.stimulusFiles),
  ),
  parts: question.parts.map(toEditorPart),
});

export const buildInitialState = (
  template: FRQTemplate | null,
): EditorState => {
  const questions = (template?.questions ?? []).map(toEditorQuestion);

  return {
    title: template?.title ?? "",
    description: createQuestionData(
      toQuestionInput(template?.directions, template?.directionsFiles),
    ),
    // "" rather than the hardcoded default: an untouched field must still save
    // as absent, so that a template nobody configured keeps falling back
    // instead of freezing today's wording into the document.
    sectionLabel: template?.sectionLabel ?? "",
    sectionSubtitle: template?.sectionSubtitle ?? "",
    // An FRQ with no questions still needs somewhere to put the first part.
    questions: questions.length > 0 ? questions : [createEditorQuestion()],
    timeLimitMinutes: template?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES,
    isPublic: template?.isPublic === true,
  };
};

/**
 * The exact document body a save writes, minus the server timestamp. Unsaved
 * state is detected by comparing this against the last persisted version rather
 * than by watching for state updates: React StrictMode double-invokes effects
 * in development, and the rich-text children re-emit equal values on mount, so
 * a "something changed" listener reported unsaved work before any edit.
 */
export const buildTemplatePayload = (state: EditorState) => ({
  title: state.title.trim() || "Untitled FRQ",
  directions: state.description.question.value,
  directionsFiles: state.description.question.files,
  sectionLabel: state.sectionLabel.trim(),
  sectionSubtitle: state.sectionSubtitle.trim(),
  timeLimitMinutes: state.timeLimitMinutes,
  isPublic: state.isPublic,
  questions: state.questions.map((question) => ({
    id: question.id,
    stimulus: question.stimulus.question.value,
    stimulusFiles: question.stimulus.question.files,
    parts: question.parts.map((part, index) => ({
      id: part.id,
      // Labels are positional and recomputed on every save, so a part that
      // moved to another question is relabelled without its id changing.
      title: getPartLabel(index),
      prompt: part.prompt.question.value,
      promptFiles: part.prompt.question.files,
      answerType: part.answerType,
      status: part.status,
      criteria: part.criteria,
    })),
  })),
});

/**
 * A part is worth the sum of its rubric lines and nothing else, which is the
 * rule the grading page and the student's feedback page also apply. `title` is
 * the one field `getPartPoints` does not read, so the shim stays here rather
 * than at every call site.
 */
export const getEditorPartPoints = (part: EditorPart) =>
  getPartPoints({ id: part.id, title: "", criteria: part.criteria });

export const getEditorQuestionPoints = (question: EditorQuestion) =>
  question.parts.reduce((total, part) => total + getEditorPartPoints(part), 0);

export const getEditorTotalPoints = (questions: EditorQuestion[]) =>
  questions.reduce(
    (total, question) => total + getEditorQuestionPoints(question),
    0,
  );

export const formatPoints = (points: number) =>
  `${points} ${points === 1 ? "point" : "points"}`;

/** Where a part currently sits, or null if no question holds it. */
export const locatePart = (questions: EditorQuestion[], partId: string) => {
  for (
    let questionIndex = 0;
    questionIndex < questions.length;
    questionIndex++
  ) {
    const partIndex =
      questions[questionIndex]?.parts.findIndex((part) => part.id === partId) ??
      -1;

    if (partIndex !== -1) {
      return { questionIndex, partIndex };
    }
  }

  return null;
};

/**
 * Apply an edit to a part wherever it currently lives.
 *
 * Addressed by part id rather than by "question X, part Y" on purpose. Parts
 * change parent now, and an edit can land after the move: a file upload that
 * started in question 1 resolves seconds later, by which point the author may
 * have moved that part into question 2. Routing through the question it used
 * to sit in would match nothing and drop the upload's download URL, leaving a
 * file that exists in Storage but renders blank for every student.
 *
 * Questions that do not hold the part keep their identity, so an edit to one
 * part does not force every other question card to re-render.
 */
export const updatePartById = (
  questions: EditorQuestion[],
  partId: string,
  updater: (part: EditorPart) => EditorPart,
): EditorQuestion[] =>
  questions.map((question) =>
    question.parts.some((part) => part.id === partId)
      ? {
          ...question,
          parts: question.parts.map((part) =>
            part.id === partId ? updater(part) : part,
          ),
        }
      : question,
  );

/** Remove a part from whichever question holds it. */
export const deletePartById = (
  questions: EditorQuestion[],
  partId: string,
): EditorQuestion[] =>
  questions.map((question) =>
    question.parts.some((part) => part.id === partId)
      ? {
          ...question,
          parts: question.parts.filter((part) => part.id !== partId),
        }
      : question,
  );

/**
 * Move a part one slot, crossing into the neighbouring question when it runs
 * off either end. This is how an author splits a flat legacy FRQ into real
 * questions: the part object travels intact, so the id that every stored
 * response and grade resolves through is unchanged by the move. Rebuilding the
 * part instead would orphan its submissions.
 */
export const movePart = (
  questions: EditorQuestion[],
  partId: string,
  direction: -1 | 1,
): EditorQuestion[] => {
  const location = locatePart(questions, partId);

  if (!location) {
    return questions;
  }

  const { questionIndex, partIndex } = location;
  const source = questions[questionIndex];
  const part = source?.parts[partIndex];

  if (!source || !part) {
    return questions;
  }

  const targetIndex = partIndex + direction;

  // Still inside the same question: swap with the neighbouring part.
  if (targetIndex >= 0 && targetIndex < source.parts.length) {
    const parts = [...source.parts];
    parts[partIndex] = parts[targetIndex]!;
    parts[targetIndex] = part;

    return questions.map((question, index) =>
      index === questionIndex ? { ...question, parts } : question,
    );
  }

  const neighbourIndex = questionIndex + direction;

  // Already the first part of the first question, or the last of the last.
  if (neighbourIndex < 0 || neighbourIndex >= questions.length) {
    return questions;
  }

  return questions.map((question, index) => {
    if (index === questionIndex) {
      return {
        ...question,
        parts: question.parts.filter((candidate) => candidate.id !== partId),
      };
    }

    if (index === neighbourIndex) {
      // Moving up lands at the end of the question above and moving down at the
      // start of the one below, so the part holds its place in reading order.
      return {
        ...question,
        parts:
          direction === -1
            ? [...question.parts, part]
            : [part, ...question.parts],
      };
    }

    return question;
  });
};

/** Whether a part at an already-located position has anywhere to go. */
const canMoveLocatedPart = (
  questions: EditorQuestion[],
  location: { questionIndex: number; partIndex: number },
  direction: -1 | 1,
): boolean => {
  const { questionIndex, partIndex } = location;

  return direction === -1
    ? questionIndex > 0 || partIndex > 0
    : questionIndex < questions.length - 1 ||
        partIndex < (questions[questionIndex]?.parts.length ?? 0) - 1;
};

/** Whether a part has anywhere to go, used to disable the move buttons. */
export const canMovePart = (
  questions: EditorQuestion[],
  partId: string,
  direction: -1 | 1,
): boolean => {
  const location = locatePart(questions, partId);

  return location ? canMoveLocatedPart(questions, location, direction) : false;
};

/**
 * Every part's location, computed once instead of scanning all questions per
 * part. The editor calls `canMovePart` twice for every part on every render,
 * which made `locatePart`'s linear scan effectively O(n^2) over the whole
 * document; building this map once per `questions` change keeps each lookup
 * O(1).
 */
export const buildPartLocationIndex = (
  questions: EditorQuestion[],
): Map<string, { questionIndex: number; partIndex: number }> => {
  const index = new Map<string, { questionIndex: number; partIndex: number }>();

  questions.forEach((question, questionIndex) => {
    question.parts.forEach((part, partIndex) => {
      index.set(part.id, { questionIndex, partIndex });
    });
  });

  return index;
};

/** Same as `canMovePart`, but reading from a precomputed location index. */
export const canMovePartIndexed = (
  questions: EditorQuestion[],
  locationIndex: Map<string, { questionIndex: number; partIndex: number }>,
  partId: string,
  direction: -1 | 1,
): boolean => {
  const location = locationIndex.get(partId);

  return location ? canMoveLocatedPart(questions, location, direction) : false;
};
