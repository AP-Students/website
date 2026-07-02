"use client";

import type { OutputData } from "@editorjs/editorjs";
import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuestionsOutput } from "./custom_questions/QuestionInstance";
import type { QuestionFormat } from "@/types/questions";

const rootMap = new Map<Element, Root>();

/**
 * Hydrates the interactive question cards inside server- or client-rendered
 * chapter markup. The markup (from `renderEditorJsToHtml`) emits an empty
 * `.questions-block-<instanceId>` placeholder for every `questionsAddCard` block;
 * this component finds each placeholder in the DOM, seeds the question data into
 * `localStorage` (the contract `QuestionsOutput` reads from), and mounts a React
 * root into it. Renders nothing itself.
 *
 * `containerId` scopes the placeholder lookup to a single article so multiple
 * renderers on a page don't clobber each other.
 */
export default function QuestionsHydrator({
  content,
  containerId,
}: {
  content: OutputData;
  containerId: string;
}) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const instanceIdsLoaded = new Set<string>();

    content.blocks.forEach((block) => {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
      if (block.type !== "questionsAddCard") return;

      const instanceId = block.data.instanceId as string;
      const storageKey = `questions_${instanceId}`;

      if (!instanceIdsLoaded.has(instanceId)) {
        const questionsFromDb: QuestionFormat[] = (
          block.data.questions as QuestionFormat[]
        ).map((questionInstance) => ({
          ...questionInstance,
          questionInstance: questionInstance.question || { value: "" },
          options: questionInstance.options.map((option) => ({
            ...option,
            value: option.value || { value: "" },
          })),
          answers: questionInstance.answers || [],
          explanation: questionInstance.explanation || { value: "" },
        }));

        localStorage.setItem(storageKey, JSON.stringify(questionsFromDb));
        window.dispatchEvent(new Event("questionsUpdated"));
        instanceIdsLoaded.add(instanceId);
      }

      const placeholder = container.querySelector(
        `.questions-block-${instanceId}`,
      );
      if (placeholder) {
        let root = rootMap.get(placeholder);
        if (!root) {
          root = createRoot(placeholder);
          rootMap.set(placeholder, root);
        }
        root.render(<QuestionsOutput instanceId={instanceId.toString()} />);
      }
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    });
  }, [content, containerId]);

  return null;
}
