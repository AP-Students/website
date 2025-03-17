import type { OutputData } from "@editorjs/editorjs";
import { BlockData } from "editorjs-parser";
import edjsParser from "editorjs-parser";
import katex from "katex";
import hljs from "highlight.js";
import "@/styles/highlightjs.css";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuestionsOutput } from "./custom_questions/QuestionInstance";
import type { QuestionFormat } from "@/types/questions";
import "@/styles/katexStyling.css";

// derived from advancedtextbox
function parseLatex(text: string): string {
  const regex = /(\$@[^$]+\$)/g;
  return text
    .split(regex)
    .map((part) => {
      if (/^\$@[^$]+\$$/.test(part)) {
        const latexContent = part.slice(2, -1);
        try {
          return katex.renderToString(latexContent, { throwOnError: false });
        } catch (err) {
          console.error("Error rendering LaTeX:", err);
          return part;
        }
      }
      return part;
    })
    .join("");
}

const customParsers: Record<string, (data: BlockData, _config: any) => string> =
  {
    alert: (data, _config) => {
      const { align, message, type } = data as {
        align: string;
        message: string;
        type: string;
      };
      return `<div class="cdx-alert cdx-alert-align-${align} cdx-alert-${type}">
      <div class="cdx-alert__message" contenteditable="true" data-placeholder="Type here..." data-empty="false">
        ${message}
      </div>
    </div>`;
    },

    code: (data, _config) => {
      const { code } = data as { code: string };
      const highlighted = hljs.highlightAuto(code).value;
      return `<pre class="code"><code>${highlighted}</code></pre>`;
    },

    delimiter: (_data, _config) => {
      return "<hr />";
    },

    embed: (data, _config) => {
      const { caption, regex, embed, source, height, width } = data as {
        caption: string;
        regex: string;
        embed: string;
        source: string;
        height: number;
        width: number;
      };
      return `<div class="cdx-block embed-tool">
      <preloader class="embed-tool__preloader">
        <div class="embed-tool__url">${source}</div>
      </preloader>
      <iframe class="rounded-lg w-full" height="${height}" width="${width}" style="margin: 0 auto;" frameborder="0" scrolling="no" allowtransparency="true" src="${embed}" class="embed-tool__content"></iframe>
      <figcaption class="fig-cap">${caption}</figcaption>
    </div>`;
    },

    math: (data, _config) => {
      const { text } = data as { text: string };
      return katex.renderToString(text, {
        output: "html",
        throwOnError: true,
        displayMode: true,
      });
    },

    paragraph: (data, _config) => {
      const { text } = data as { text: string };
      if (text.includes("</code>")) {
        return `<code class="inline-code">${text}</code>`;
      }
      const parsedText = parseLatex(text);
      return `<p class="paragraph">${parsedText}</p>`;
    },

    quote: (data, _config) => {
      const { alignment, caption, text } = data as {
        alignment: string;
        caption: string;
        text: string;
      };
      return `<blockquote>
      <p class="mb-3">${text}</p>
      <cite>${caption}</cite>
    </blockquote>`;
    },

    table: (data, _config) => {
      const { withHeadings, content } = data as {
        withHeadings: boolean;
        content: string[][];
      };
      if (content.length === 0) {
        return "<table></table>";
      }
      const rows = content.map((row, index) => {
        if (withHeadings && index === 0) {
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
      const thead = withHeadings ? `<thead>${rows.shift()}</thead>` : "";
      const tbody = `<tbody>${rows.join("")}</tbody>`;

      return `<table>${thead}${tbody}</table>`;
    },

    questionsAddCard: (data, _config) => {
      const { instanceId } = data as {
        instanceId: string;
        content: QuestionFormat;
      };
      return `<div class="questions-block-${instanceId}"></div>`;
    },
  };

const rootMap = new Map<Element, Root>();

const Renderer = (props: { content: OutputData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceIdsLoaded = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const blocks = props.content.blocks;
        blocks.forEach((block) => {
          if (block.type === "questionsAddCard") {
            const instanceId = (block.data).instanceId as string;
            const storageKey = `questions_${instanceId}`;

            // Check if this instanceId has already been processed
            if (!instanceIdsLoaded.current.has(instanceId)) {
              /* eslint-disable */
              const questionsFromDb: QuestionFormat[] = (
                block.data as any
              ).questions.map((questionInstance: QuestionFormat) => ({
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

              // Trigger a manual event to notify listeners that localStorage was updated
              const event = new Event("questionsUpdated");
              window.dispatchEvent(event);

              // Mark this instanceId as loaded
              instanceIdsLoaded.current.add(instanceId);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching questions:", error);
      }

      // Proceed to render the components
      if (containerRef.current) {
        props.content.blocks.forEach((block) => {
          /* eslint-disable */ // InstanceOf doesnt seem to work so Im just using this as a substitute
          if (block.type === "questionsAddCard") {
            const instanceId = (block.data as any).instanceId;
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
    customParsers,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const markup = parser.parse(props.content);

  return (
    <article
      ref={containerRef}
      className="prose before:prose-code:content-none after:prose-code:content-none"
      dangerouslySetInnerHTML={{ __html: markup }}
    ></article>
  );
};

export default Renderer;
