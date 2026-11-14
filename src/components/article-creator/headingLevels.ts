/*
 * Levels for the article editor's Heading block.
 */

/** The levels an author can choose: Heading 1, 2 and 3. */
export const HEADING_LEVELS: readonly number[] = [1, 2, 3];

/**
 * The level a new Heading gets, whether it is added from the toolbox, "/",
 * or its shortcut, or converted from another block. Headings that were saved
 * with a level keep it.
 */
export const DEFAULT_HEADING_LEVEL = 1;

/**
 * The offered level closest to `level`. A heading saved at a level the
 * editor doesn't offer, such as an H4 in imported JSON, keeps its place in
 * the outline instead of jumping to the default. It is the rule the Heading
 * tool already uses for pasted H4 to H6, ties included.
 */
export function nearestHeadingLevel(
  level: number,
  offered: readonly number[],
): number {
  if (offered.length === 0 || offered.includes(level)) return level;
  return offered.reduce((nearest, candidate) =>
    Math.abs(candidate - level) < Math.abs(nearest - level)
      ? candidate
      : nearest,
  );
}
