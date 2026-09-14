/** A calculator setting. "inherit" defers to the next broader scope. */
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
 * Resolve calculator permission from most-specific to broadest scope:
 * question > set > course. "inherit" (or an absent legacy field) falls
 * through, and no explicit setting resolves to `false` for safety.
 */
export const resolveCalculatorPermission = (
  courseDefault: CalculatorPermission | undefined,
  setDefault: CalculatorPermission | undefined,
  questionOverride: CalculatorPermission | undefined,
): boolean => {
  if (questionOverride === "allowed") return true;
  if (questionOverride === "not-allowed") return false;

  if (setDefault === "allowed") return true;
  if (setDefault === "not-allowed") return false;

  return courseDefault === "allowed";
};
