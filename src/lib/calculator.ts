/** Per-assessment or per-question calculator setting. "inherit" defers to the assessment default. */
export type CalculatorPermission = "allowed" | "not-allowed" | "inherit";

export type CalculatorType = "fourFunction" | "scientific" | "graphing";

/** College Board-approved Desmos testing calculators, embedded directly. */
export const DESMOS_CALCULATOR_URLS: Record<CalculatorType, string> = {
  fourFunction: "https://www.desmos.com/testing/collegeboard/fourfunction",
  scientific: "https://www.desmos.com/testing/collegeboard/scientific",
  graphing: "https://www.desmos.com/testing/collegeboard/graphing",
};

export const CALCULATOR_TYPE_LABELS: Record<CalculatorType, string> = {
  fourFunction: "Four-Function",
  scientific: "Scientific",
  graphing: "Graphing",
};

/**
 * Question setting overrides assessment default; "inherit" or absent falls
 * through. An assessment/question with neither field set resolves to `false`,
 * matching the safe default for assessments authored before this feature.
 */
export const resolveCalculatorPermission = (
  assessmentDefault: CalculatorPermission | undefined,
  questionOverride: CalculatorPermission | undefined,
): boolean => {
  if (questionOverride === "allowed") return true;
  if (questionOverride === "not-allowed") return false;

  return assessmentDefault === "allowed";
};
