import type {
  FRQAnswerType,
  FRQGradingCriterion,
  FRQQuestionStatus,
  FRQTemplate,
  FRQTemplateQuestion,
} from "@/types/frq";
import type { QuestionFile, QuestionInput } from "@/types/questions";

/** Default minutes on the clock when a template predates the time-limit field. */
export const DEFAULT_TIME_LIMIT_MINUTES = 90;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/**
 * Firestore hands back whatever was written, and FRQ documents predate several
 * schema passes. Every field is therefore re-checked rather than cast, so one
 * malformed document degrades to an empty prompt instead of crashing the page
 * that renders it.
 */
const normalizeFiles = (value: unknown): QuestionFile[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): QuestionFile[] => {
    const record = asRecord(entry);

    if (!record || typeof record.key !== "string") {
      return [];
    }

    const file: QuestionFile = {
      key: record.key,
      name: asString(record.name) || record.key,
    };

    if (typeof record.url === "string") file.url = record.url;
    if (typeof record.id === "string") file.id = record.id;
    if (typeof record.alt === "string") file.alt = record.alt;
    if (typeof record.order === "number") file.order = record.order;

    return [file];
  });
};

const normalizeCriteria = (value: unknown): FRQGradingCriterion[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index): FRQGradingCriterion[] => {
    const record = asRecord(entry);

    if (!record) {
      return [];
    }

    const points = Number(record.points);

    return [
      {
        id: asString(record.id) || `criterion-${index}`,
        description: asString(record.description),
        // A criterion worth a fraction of a point would make the "x/y points"
        // summaries on three separate pages disagree, so clamp to whole points.
        points: Number.isFinite(points) ? Math.max(0, Math.round(points)) : 0,
      },
    ];
  });
};

const normalizeAnswerType = (value: unknown): FRQAnswerType =>
  value === "equation" ? "equation" : "text";

const normalizeStatus = (value: unknown): FRQQuestionStatus =>
  value === "legacy" ? "legacy" : "public";

const normalizeQuestion = (
  value: unknown,
  index: number,
): FRQTemplateQuestion[] => {
  const record = asRecord(value);

  if (!record) {
    return [];
  }

  const id = asString(record.id);

  // A part with no stable id cannot be scored or matched to a response, so it
  // is dropped rather than given a positional id that would silently rebind to
  // a different part the next time the author reorders the list.
  if (!id) {
    return [];
  }

  return [
    {
      id,
      title: asString(record.title) || `Part ${index + 1}`,
      prompt: asString(record.prompt),
      promptFiles: normalizeFiles(record.promptFiles),
      answerType: normalizeAnswerType(record.answerType),
      status: normalizeStatus(record.status),
      criteria: normalizeCriteria(record.criteria),
    },
  ];
};

/**
 * Turn a raw Firestore FRQ document into a template every page can trust.
 * `identity` supplies the values that live in the document path rather than the
 * document body, so a template still knows where it came from when the stored
 * `subject`/`unitId` fields are missing.
 */
export const normalizeFrqTemplate = (
  raw: unknown,
  identity: { id: string; subject: string; unitId: string },
): FRQTemplate => {
  const record = asRecord(raw) ?? {};
  const timeLimit = Number(record.timeLimitMinutes);

  return {
    id: identity.id,
    subject: asString(record.subject) || identity.subject,
    unitId: asString(record.unitId) || identity.unitId,
    title: asString(record.title) || "Untitled FRQ",
    directions: asString(record.directions),
    directionsFiles: normalizeFiles(record.directionsFiles),
    questions: Array.isArray(record.questions)
      ? record.questions.flatMap(normalizeQuestion)
      : [],
    isPublic: record.isPublic === true,
    timeLimitMinutes:
      Number.isFinite(timeLimit) && timeLimit >= 1
        ? Math.floor(timeLimit)
        : DEFAULT_TIME_LIMIT_MINUTES,
  };
};

export const toQuestionInput = (
  value: string | undefined,
  files: QuestionFile[] | undefined,
): QuestionInput => ({
  value: value ?? "",
  files: files ? [...files] : [],
});

/** Parts a student actually sits. Legacy parts stay readable but unassigned. */
export const getStudentFacingQuestions = (template: FRQTemplate) =>
  template.questions.filter((question) => question.status !== "legacy");

export const getQuestionPoints = (question: FRQTemplateQuestion) =>
  (question.criteria ?? []).reduce(
    (total, criterion) => total + criterion.points,
    0,
  );

export const getTemplatePoints = (questions: FRQTemplateQuestion[]) =>
  questions.reduce(
    (total, question) => total + getQuestionPoints(question),
    0,
  );

/**
 * AP-style part label: A, B, C ... then AA, AB past 26 parts rather than
 * walking off the end of the alphabet into punctuation.
 */
export const getPartLabel = (index: number) => {
  let label = "";
  let remaining = index;

  do {
    label = String.fromCharCode(65 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);

  return label;
};

/** Strips markup so "did the student write anything" is not fooled by `<p></p>`. */
export const hasResponseText = (response: string | undefined) =>
  (response ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
