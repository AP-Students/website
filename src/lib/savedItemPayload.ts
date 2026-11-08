import type { SavedItem } from "@/types/dashboard";

/**
 * Subject slug, unit and chapter/test id for a page URL such as
 * `/subject/biology/unit-1-xgxskm69/chapter/0kvtm3P4/structure-of-water`.
 *
 * The unit segment is `unit-{displayNumber}-{firestoreUnitId}`. Only
 * `unit-{displayNumber}` is kept, which is the form the dashboard turns into a
 * "Unit 1" label. Returns null for every other route, e.g. the admin editor,
 * so those pages never show a Save button.
 */
export function pathContext(path: string) {
  const match =
    /^\/subject\/([^/]+)\/(unit-\d+)(?:-[^/]+)?\/(?:chapter|test)\/([^/]+)/.exec(
      path,
    );
  if (!match) return null;
  return { subject: match[1]!, unitId: match[2]!, refId: match[3]! };
}

/**
 * The document stored for a saved reading or question (the dashboard
 * `SavedItem` without `id`, which is the document id, and `savedAt`, which is
 * set by the server).
 *
 * Firestore rejects `undefined` field values, so `questionIndex` is only
 * present when there is one.
 */
export function buildSavedItem(input: {
  kind: SavedItem["kind"];
  context: NonNullable<ReturnType<typeof pathContext>>;
  questionIndex?: number;
  label: string;
  href: string;
}): Omit<SavedItem, "id" | "savedAt"> {
  const { kind, context, questionIndex, label, href } = input;
  return {
    kind,
    subject: context.subject,
    unitId: context.unitId,
    refId: context.refId,
    ...(questionIndex !== undefined && { questionIndex }),
    label: (label.trim() || "Untitled").slice(0, 200),
    href,
  };
}
