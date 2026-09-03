import type {
  FRQAnswerType,
  FRQGradingCriterion,
  FRQQuestionStatus,
  FRQTemplate,
  FRQTemplatePart,
  FRQTemplateQuestion,
} from "@/types/frq";
import type { QuestionFile, QuestionInput } from "@/types/questions";
import type { CalculatorPermission, CalculatorType } from "@/lib/calculator";

/** Default minutes on the clock when a template predates the time-limit field. */
export const DEFAULT_TIME_LIMIT_MINUTES = 90;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/**
 * For fields the type marks optional, where absent carries meaning. Blank
 * collapses to absent so the field is only ever a non-empty string or missing,
 * which is what lets a consumer use `??` and `||` interchangeably: against a
 * stored `""` the two disagree, and `sectionLabel ?? "Section II"` would render
 * a blank heading for a template nobody ever configured.
 */
const asOptionalString = (value: unknown): string | undefined => {
  const text = typeof value === "string" ? value.trim() : "";

  return text === "" ? undefined : text;
};

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

const normalizeCalculatorPermission = (
  value: unknown,
): CalculatorPermission | undefined =>
  value === "allowed" || value === "not-allowed" || value === "inherit"
    ? value
    : undefined;

const normalizeCalculatorType = (value: unknown): CalculatorType | undefined =>
  value === "fourFunction" || value === "scientific" || value === "graphing"
    ? value
    : undefined;

/**
 * The id of the single question that legacy flat documents are wrapped into,
 * and also minted for every new save (including brand-new FRQs never legacy).
 * A constant rather than a generated id: the wrap is re-derived on every read,
 * so a random id would differ between two reads of the same document.
 */
export const LEGACY_QUESTION_ID = "legacy-question";

const normalizePart = (value: unknown, index: number): FRQTemplatePart[] => {
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

const normalizeQuestion = (value: unknown): FRQTemplateQuestion[] => {
  const record = asRecord(value);

  if (!record) {
    return [];
  }

  const id = asString(record.id);

  if (!id) {
    return [];
  }

  const question: FRQTemplateQuestion = {
    id,
    stimulus: asString(record.stimulus),
    stimulusFiles: normalizeFiles(record.stimulusFiles),
    parts: Array.isArray(record.parts)
      ? record.parts.flatMap(normalizePart)
      : [],
  };

  const calculatorOverride = normalizeCalculatorPermission(
    record.calculatorOverride,
  );

  if (calculatorOverride) question.calculatorOverride = calculatorOverride;

  return [question];
};

/**
 * Documents written before the question/part split stored a flat list of parts
 * under `questions`. They are detected by the absence of a `parts` array — a
 * question authored under the new shape always has one, even when empty — and
 * wrapped into a single question so the rest of the app sees one shape.
 *
 * The template's `directions` was already the stimulus those documents used,
 * and it stays exam-wide, so a wrapped document renders exactly as before.
 */
const normalizeQuestions = (value: unknown): FRQTemplateQuestion[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  // Legacy iff NO entry carries a parts array. Stated negatively on purpose:
  // an `every` over "lacks parts" also fails on non-object entries, which
  // misclassified a legacy document containing a stray null as nested and
  // silently discarded all of its parts.
  const isLegacyShape =
    value.length > 0 &&
    !value.some((entry) => Array.isArray(asRecord(entry)?.parts));

  if (!isLegacyShape) {
    return value.flatMap(normalizeQuestion);
  }

  const parts = value.flatMap(normalizePart);

  return parts.length > 0
    ? [
        {
          id: LEGACY_QUESTION_ID,
          stimulus: "",
          stimulusFiles: [],
          parts,
        },
      ]
    : [];
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

  const template: FRQTemplate = {
    id: identity.id,
    subject: asString(record.subject) || identity.subject,
    unitId: asString(record.unitId) || identity.unitId,
    title: asString(record.title) || "Untitled FRQ",
    directions: asString(record.directions),
    directionsFiles: normalizeFiles(record.directionsFiles),
    questions: normalizeQuestions(record.questions),
    isPublic: record.isPublic === true,
    timeLimitMinutes:
      Number.isFinite(timeLimit) && timeLimit >= 1
        ? Math.floor(timeLimit)
        : DEFAULT_TIME_LIMIT_MINUTES,
  };

  // Assigned only when configured, so the key is genuinely missing on a
  // template that predates section headings rather than present-and-blank.
  const sectionLabel = asOptionalString(record.sectionLabel);
  const sectionSubtitle = asOptionalString(record.sectionSubtitle);
  const calculatorDefault = normalizeCalculatorPermission(
    record.calculatorDefault,
  );
  const calculatorType = normalizeCalculatorType(record.calculatorType);

  if (sectionLabel) template.sectionLabel = sectionLabel;
  if (sectionSubtitle) template.sectionSubtitle = sectionSubtitle;
  if (calculatorDefault) template.calculatorDefault = calculatorDefault;
  if (calculatorType) template.calculatorType = calculatorType;

  return template;
};

export const toQuestionInput = (
  value: string | undefined,
  files: QuestionFile[] | undefined,
): QuestionInput => ({
  value: value ?? "",
  files: files ? [...files] : [],
});

/** Every part in the document, in reading order, ignoring visibility. */
export const getAllParts = (template: FRQTemplate): FRQTemplatePart[] =>
  template.questions.flatMap((question) => question.parts);

/** Parts a student actually sits. Legacy parts stay readable but unassigned. */
export const getStudentFacingParts = (
  template: FRQTemplate,
): FRQTemplatePart[] =>
  getAllParts(template).filter((part) => part.status !== "legacy");

/**
 * Questions a student actually sits, each carrying only its visible parts.
 * A question whose parts are all legacy is dropped, so the test never pages to
 * a question with nothing on it.
 */
export const getStudentFacingQuestions = (
  template: FRQTemplate,
): FRQTemplateQuestion[] =>
  template.questions
    .map((question) => ({
      ...question,
      parts: question.parts.filter((part) => part.status !== "legacy"),
    }))
    .filter((question) => question.parts.length > 0);

export const getPartPoints = (part: FRQTemplatePart) =>
  (part.criteria ?? []).reduce(
    (total, criterion) => total + criterion.points,
    0,
  );

export const getTemplatePoints = (parts: FRQTemplatePart[]) =>
  parts.reduce((total, part) => total + getPartPoints(part), 0);

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

/**
 * Unique, immutable ID built from the current time plus a short random suffix.
 * The random half is what makes it collision-safe: a timestamp alone repeats
 * when several IDs are minted in the same millisecond.
 */
export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
