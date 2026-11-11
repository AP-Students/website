import type { Option } from "@/types/questions";

/*
 * A question's `answers` hold the 1-based positions of its correct options,
 * exactly as the author types them in the question editor ("Option 5" is
 * "5"). They are not option ids: only the four starter options happen to
 * have ids "1" to "4", while an added option gets a timestamp id, and
 * deleting an option shifts every position after it.
 *
 * Everything that checks a student's choice works in option ids, so it goes
 * through `correctOptionIds` to turn the stored positions into the ids of the
 * options they point at.
 */

/** Reads a stored answer as a 1-based option position, or null if it isn't one. */
function answerPosition(answer: string): number | null {
  const trimmed = answer.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const position = Number(trimmed);
  return position >= 1 ? position : null;
}

/**
 * The ids of the options a question's stored answers point at, in answer
 * order. Answers that are blank, malformed, or past the last option are
 * skipped, so a question with no usable answer has no correct option.
 */
export function correctOptionIds(
  options: readonly Pick<Option, "id">[],
  answers: readonly string[],
): string[] {
  const ids: string[] = [];
  for (const answer of answers) {
    const position = answerPosition(answer);
    const id = position === null ? undefined : options[position - 1]?.id;
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * The stored answers after the option at `removedIndex` (0-based) is deleted,
 * so they keep pointing at the same options: an answer for the deleted option
 * is dropped, and an answer for an option after it moves up one position.
 * Entries that aren't positions are kept as they are.
 */
export function answersAfterOptionRemoved(
  answers: readonly string[],
  removedIndex: number,
): string[] {
  const removedPosition = removedIndex + 1;
  const next: string[] = [];
  for (const answer of answers) {
    const position = answerPosition(answer);
    if (position === null) next.push(answer);
    else if (position < removedPosition) next.push(String(position));
    else if (position > removedPosition) next.push(String(position - 1));
  }
  return next;
}

/**
 * The numbers in an answer that name no option, for the editor to flag
 * (for example "6" on a question with five options, or "0").
 */
export function missingOptionPositions(
  answers: readonly string[],
  optionCount: number,
): number[] {
  const missing: number[] = [];
  for (const answer of answers) {
    const trimmed = answer.trim();
    if (!/^\d+$/.test(trimmed)) continue;
    const position = Number(trimmed);
    if (position < 1 || position > optionCount) missing.push(position);
  }
  return missing;
}
