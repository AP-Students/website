import type { OutputBlockData, OutputData } from "@editorjs/editorjs";
import edjsParser from "editorjs-parser";
import katex from "katex";
import hljs from "highlight.js";
import "@/styles/highlightjs.css";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuestionsOutput } from "./custom_questions/QuestionInstance";
import type { QuestionFormat } from "@/types/questions";
import "@/styles/katexStyling.css";
import { QuestionsAddCard } from "./custom_questions/QuestionsAddCard";

const customParsers = {
  alert: (data: { align: string; message: string; type: string }) => {
    return `<div class="cdx-alert cdx-alert-align-${data.align} cdx-alert-${data.type}"><div class="cdx-alert__message" contenteditable="true" data-placeholder="Type here..." data-empty="false">${data.message}</div></div>`;
  },

  code: (data: { code: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const code = hljs.highlightAuto(data.code).value;
    return `<pre class="code"><code>${code}</code></pre>`;
  },

  delimiter: () => {
    return "<hr />";
  },

  embed: (data: {
    caption: string;
    regex: string;
    embed: string;
    source: string;
    height: number;
    width: number;
  }) => {
    return `<div class="cdx-block embed-tool"><preloader class="embed-tool__preloader"><div class="embed-tool__url">${data.source}</div></preloader><iframe class="rounded-lg w-full" height="${data.height}" width="${data.width}" style="margin: 0 auto;" frameborder="0" scrolling="no" allowtransparency="true" src="${data.embed}" class="embed-tool__content"></iframe><figcaption class="fig-cap">${data.caption}</figcaption></div>`;
  },

  math: (data: { text: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return katex.renderToString(data.text, {
      output: "html",
      throwOnError: true,
      displayMode: true,
    });
  },

  paragraph: (data: { text: string }) => {
    if (data.text.includes("</code>")) {
      return `<code class="inline-code">${data.text}</code>`;
    }
    return `<p class="paragraph">${data.text}</p>`;
  },

  quote: (data: { alignment: string; caption: string; text: string }) => {
    return `<blockquote><p class="mb-3">${data.text}</p><cite>${data.caption}</cite></blockquote>`;
  },

  table: (data: { withHeadings: boolean; content: string[][] }) => {
    // Check if the content array has at least one row
    if (data.content.length === 0) {
      return "<table></table>"; // Return an empty table if no content
    }

    // Process rows
    const rows = data.content.map((row, index) => {
      // For the first row and if withHeadings is true, use <th> tags
      if (data.withHeadings && index === 0) {
        return `<tr class="divide-x-[1px]">${row.reduce(
          (acc, cell) => acc + `<th>${cell}</th>`,
          "",
        )}</tr>`;
      }

      // For other rows, use <td> tags
      return `<tr class="divide-x-[1px]">${row.reduce(
        (acc, cell) => acc + `<td>${cell}</td>`,
        "",
      )}</tr>`;
    });

    // Construct the table with optional thead and tbody
    const thead = data.withHeadings ? `<thead>${rows.shift()}</thead>` : "";
    const tbody = `<tbody>${rows.join("")}</tbody>`;

    return `<table>${thead}${tbody}</table>`;
  },

  questionsAddCard: (data: { instanceId: string; content: QuestionFormat }) => {
    const instanceUUID = data.instanceId;
    // const content = JSON.stringify(data.content);
    return `<div class="questions-block-${instanceUUID}"></div>`;
  },
};

const rootMap = new Map<Element, Root>();

const Renderer = (props: { content: OutputData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataFetched = useRef<boolean>(false);
  const instanceIdsLoaded = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = props.content.blocks;

        // Process data.blocks only once
        data.forEach((block) => {
          if (block.data instanceof QuestionsAddCard) {
            const instanceId = block.data.instanceId;
            const storageKey = `questions_${instanceId}`;

            // Check if this instanceId has already been processed
            if (!instanceIdsLoaded.current.has(instanceId)) {
              const questionsFromDb: QuestionFormat[] =
                block.data.questions.map(
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
                    explanation: questionInstance.explanation || {
                      value: "",
                    },
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

      // Proceed to render the components
      if (containerRef.current) {
        props.content.blocks.forEach((block) => {
          /* eslint-disable */ // InstanceOf doesnt seem to work so Im just using this as a substitute
          if (block.type === "questionsAddCard") {
            const instanceId = block.data.instanceId;
            const placeholder = containerRef.current!.querySelector(
              `.questions-block-${instanceId}`,
            );

            if (placeholder) {
              let root = rootMap.get(placeholder);

              // If no root exists for this placeholder, create one and store it
              if (!root) {
                root = createRoot(placeholder);
                rootMap.set(placeholder, root);
              }

              // Render the component
              root.render(
                <QuestionsOutput instanceId={instanceId.toString()} />,
              );
            }
          }
          /* eslint-enable */
        });
      }
    };

    // Call the fetchData function
    fetchData().catch((error) => {
      console.error("Error fetching data:", error);
    });
  }, [props.content]);
  if (!props.content) return null;

  const parser = new edjsParser(
    {
      image: {
        use: "figure",
        imgClass: "img rounded-lg",
      },
    },
    // @ts-expect-error customParsers is correct but TS doesn't know that
    customParsers,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const markup = parser.parse(props.content);

  return (
    <article
      ref={containerRef}
      className="prose before:prose-code:content-none after:prose-code:content-none"
      dangerouslySetInnerHTML={{
        __html: markup,
      }}
    ></article>
  );
};

export default Renderer;
