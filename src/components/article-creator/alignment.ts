// Single source of truth for what a block's alignment tune is allowed to
// contain. Anything read from Firestore, an imported/pasted JSON blob, or
// user input is checked against this list before it's ever trusted.
export const ALIGNMENT_VALUES = ["left", "center", "right", "justify"] as const;

export type AlignmentValue = (typeof ALIGNMENT_VALUES)[number];

export function sanitizeAlignment(value: unknown): AlignmentValue | undefined {
  return typeof value === "string" &&
    (ALIGNMENT_VALUES as readonly string[]).includes(value)
    ? (value as AlignmentValue)
    : undefined;
}
