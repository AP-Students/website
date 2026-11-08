import type { QuestionFormat, QuestionInput } from "@/types/questions";

/** A question block's preview card: the placeholder it is mounted in, and its root. */
export type MountedPreview<Element, Root> = { element: Element; root: Root };

/**
 * Matches the question placeholders now in the preview to the React roots
 * mounted in them.
 *
 * The preview's HTML is replaced whenever the article changes, and a root left
 * in a replaced placeholder renders into a node that is no longer on the page:
 * the question card is simply gone. So a placeholder that is still the same
 * node keeps its root (and whatever the author had clicked in the quiz), a new
 * node gets a new root, and every root whose placeholder went is returned for
 * unmounting instead of being left running in a detached node.
 */
export function syncPreviewRoots<Element, Root>(
  mounted: ReadonlyMap<string, MountedPreview<Element, Root>>,
  placeholders: ReadonlyMap<string, Element>,
  createRoot: (element: Element) => Root,
): { mounted: Map<string, MountedPreview<Element, Root>>; stale: Root[] } {
  const next = new Map<string, MountedPreview<Element, Root>>();
  for (const [instanceId, element] of placeholders) {
    const current = mounted.get(instanceId);
    next.set(
      instanceId,
      current?.element === element
        ? current
        : { element, root: createRoot(element) },
    );
  }
  const stale: Root[] = [];
  for (const [instanceId, current] of mounted) {
    if (next.get(instanceId)?.root !== current.root) stale.push(current.root);
  }
  return { mounted: next, stale };
}

const emptyInput = (): QuestionInput => ({ value: "", files: [] });

/**
 * A question block's stored questions, with the fields older saves can lack
 * filled in, so one malformed question can't crash the card that shows it.
 */
export function previewQuestions(stored: unknown): QuestionFormat[] {
  if (!Array.isArray(stored)) return [];
  return (stored as Partial<QuestionFormat>[])
    .filter((question) => question && typeof question === "object")
    .map((question) => ({
      ...question,
      question: question.question ?? emptyInput(),
      type: question.type ?? "mcq",
      options: (question.options ?? []).map((option) => ({
        ...option,
        value: option.value ?? emptyInput(),
      })),
      answers: question.answers ?? [],
      explanation: question.explanation ?? emptyInput(),
      content: question.content ?? emptyInput(),
      topic: question.topic ?? "",
    }));
}
