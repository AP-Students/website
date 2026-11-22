import type { OutputData } from "@editorjs/editorjs";
import { useEffect, useMemo, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuestionsView } from "./custom_questions/QuestionInstance";
import {
  previewQuestions,
  syncPreviewRoots,
  type MountedPreview,
} from "./questionPreviews";
import type { QuestionFormat } from "@/types/questions";
import { renderEditorJsToHtml } from "./editorjs-render";

// The preview renders with the same code as the published chapter page, so
// what an author sees here is exactly what students get. These two are still
// imported from here by the question boxes and the test header.
export { decodeEntities, katexMacros } from "./editorjs-render";

const Renderer = (props: { content: OutputData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataFetched = useRef<boolean>(false);
  const instanceIdsLoaded = useRef<Set<string>>(new Set());
  const previews = useRef(new Map<string, MountedPreview<Element, Root>>());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = props.content.blocks;

        // Process data.blocks only once
        data.forEach((block) => {
          if (block.type === "questionsAddCard") {
            // block.data is a <string, any> and since its part of editorjs, im not changing the type.
            // As long as editorjs doesnt depricate in a way that affects this, then this should be fine
            /* eslint-disable-next-line */
            const instanceId = block.data.instanceId as string;
            const storageKey = `questions_${instanceId}`;

            // Check if this instanceId has already been processed
            if (!instanceIdsLoaded.current.has(instanceId)) {
              /* eslint-disable */
              const questionsFromDb: QuestionFormat[] =
                block.data.questions.map(
                  /* eslint-enable */
                  (questionInstance: QuestionFormat) => ({
                    ...questionInstance,
                    questionInstance: questionInstance.question || {
                      value: "",
                    },
                    options: questionInstance.options.map((option) => ({
                      ...option,
                      value: option.value || { value: "" },
                    })),
                    answers: questionInstance.answers || [],
                    explanation: questionInstance.explanation || { value: "" },
                  }),
                );

              // Update local storage (Will be used line XXX)
              localStorage.setItem(storageKey, JSON.stringify(questionsFromDb));

              // Trigger a manual event to notify listeners that localStorage was updated
              const event = new Event("questionsUpdated");
              window.dispatchEvent(event);

              // Mark this instanceId as loaded
              instanceIdsLoaded.current.add(instanceId);
            }
          }
        });

        // Set dataFetched to true after processing all blocks
        dataFetched.current = true;
      } catch (error) {
        console.error("Error fetching questions from Firestore:", error);
      }
    };

    // Call the fetchData function
    fetchData().catch((error) => {
      console.error("Error fetching data:", error);
    });
  }, [props.content]);

  const markup = useMemo(
    () => (props.content ? renderEditorJsToHtml(props.content) : ""),
    [props.content],
  );

  // The React build Next ships rewrites `innerHTML` whenever this prop is a new
  // object, even when the HTML inside is identical. Built inline, every
  // re-render of the page around it (autosave's "Saving…"/"Saved" included)
  // replaced the question placeholders and took the cards mounted in them.
  const html = useMemo(() => ({ __html: markup }), [markup]);

  const questionBlocks = useMemo(
    () =>
      (props.content?.blocks ?? [])
        .filter((block) => block.type === "questionsAddCard")
        .map((block) => {
          const data = block.data as {
            instanceId?: unknown;
            questions?: unknown;
          };
          return {
            instanceId: String(data.instanceId),
            questions: previewQuestions(data.questions),
          };
        }),
    [props.content],
  );

  // After every render, not only when the content changes: if the HTML was
  // replaced for any reason, its question placeholders are new nodes and need
  // their cards mounted again. Each card gets the questions from the editor's
  // latest output, so editing a question updates the preview too.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const placeholders = new Map<string, Element>();
    for (const { instanceId } of questionBlocks) {
      const placeholder = container.querySelector(
        `.questions-block-${CSS.escape(instanceId)}`,
      );
      if (placeholder) placeholders.set(instanceId, placeholder);
    }

    const { mounted, stale } = syncPreviewRoots(
      previews.current,
      placeholders,
      (placeholder) => createRoot(placeholder),
    );
    previews.current = mounted;
    for (const { instanceId, questions } of questionBlocks) {
      // Keyed by count: adding or removing a question starts the quiz over
      // rather than leaving it on a question that no longer exists.
      mounted
        .get(instanceId)
        ?.root.render(
          <QuestionsView key={questions.length} questions={questions} />,
        );
    }
    // Unmounting another root synchronously from inside this commit makes
    // React warn about a race, so the detached ones go just after it.
    if (stale.length) setTimeout(() => stale.forEach((root) => root.unmount()));
  });

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Deferred like the stale roots above, and checked again when it runs:
      // React's development-mode double mount runs this cleanup and then
      // mounts the same Renderer again, which goes on using these roots.
      setTimeout(() => {
        if (isMounted.current) return;
        previews.current.forEach(({ root }) => root.unmount());
        previews.current = new Map();
      });
    };
  }, []);

  if (!props.content) return null;

  return (
    <article
      ref={containerRef}
      className="prose break-words [overflow-wrap:anywhere] before:prose-code:content-none after:prose-code:content-none"
      dangerouslySetInnerHTML={html}
    ></article>
  );
};

export default Renderer;
