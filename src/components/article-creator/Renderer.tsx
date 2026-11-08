import type { OutputData } from "@editorjs/editorjs";
import type { BlockData, Config } from "editorjs-parser";
import edjsParser from "editorjs-parser";
import katex from "katex";
import "katex/contrib/mhchem";
import hljs from "highlight.js";
import "@/styles/highlightjs.css";
import { useEffect, useMemo, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuestionsView } from "./custom_questions/QuestionInstance";
import {
  previewQuestions,
  syncPreviewRoots,
  type MountedPreview,
} from "./questionPreviews";
import type { QuestionFormat } from "@/types/questions";
import "@/styles/katexStyling.css";
import styles from "./Renderer.module.css";
import { sanitizeAlignment } from "./alignment";
import { renderRichCaptionToHtml } from "./caption-rich-text/render";
import { coerceRichCaption } from "./caption-rich-text/convert";

// Tool names the "alignment" BlockTune is registered on (see Editor.tsx).
const ALIGNABLE_TYPES = new Set(["paragraph", "header", "list"]);

export function decodeEntities(str: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export const katexMacros = {
  "\\unit": "\\,\\mathrm{#1}",
  "\\qty": "#1\\,\\mathrm{#2}",
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// derived from advancedtextbox
//
// `transformText` is applied to the non-LaTeX segments only. Paragraphs, headers
// and list items legitimately store EditorJS inline markup (<b>, <mark>, <a>, an
// inline toolbar is enabled on all three), so they pass it through untouched.
// Table cells have no inline toolbar and are plain text, so the table parser
// passes `escapeHtml`. That has to happen in here rather than around the result,
// or it would escape KaTeX's own generated HTML too.
function parseLatex(
  text: string,
  transformText: (part: string) => string = (part) => part,
): string {
  const decoded = decodeEntities(text);

  return decoded
    .split(/(\$@[^$]+\$)/g)
    .map((part) => {
      if (/^\$@[^$]+\$$/.test(part)) {
        const expr = part.slice(2, -1);
        return katex.renderToString(expr, {
          throwOnError: false,
          output: "html",
          macros: katexMacros,
        });
      }
      return transformText(part);
    })
    .join("");
}

const customParsers: Record<
  string,
  (data: BlockData, _config: Config) => string
> = {
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
      macros: katexMacros,
    });
  },

  paragraph: (data, _config) => {
    const { text } = data as { text: string };
    const parsedText = parseLatex(text);
    return `<p class="paragraph">${parsedText}</p>`;
  },

  header: (data, _config) => {
    const { text, level } = data as { text: string; level: number };
    const lvl = Math.min(Math.max(level || 1, 1), 6);
    const parsedText = parseLatex(text);
    return `<h${lvl}>${parsedText}</h${lvl}>`;
  },

  quote: (data, _config) => {
    const { alignment, caption, text } = data as {
      alignment: string;
      caption: string;
      text: string;
    };
    // Quote's own native settings only ever offer left/center (see
    // @editorjs/quote's renderSettings), so only "center" needs a style.
    const style = alignment === "center" ? ' style="text-align:center"' : "";
    return `<blockquote${style}>
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
    const cellClass = "border border-black px-3 py-1.5 text-center";
    const rows = content.map((row, index) => {
      if (withHeadings && index === 0) {
        return `<tr>${row.reduce(
          (acc, cell) =>
            acc +
            `<th class="${cellClass}">${parseLatex(cell, escapeHtml)}</th>`,
          "",
        )}</tr>`;
      }

      // For other rows, use <td> tags
      return `<tr>${row.reduce(
        (acc, cell) =>
          acc + `<td class="${cellClass}">${parseLatex(cell, escapeHtml)}</td>`,
        "",
      )}</tr>`;
    });
    const thead = withHeadings ? `<thead>${rows.shift()}</thead>` : "";
    const tbody = `<tbody>${rows.join("")}</tbody>`;

    return `<div class="overflow-x-auto" tabindex="0" role="region" aria-label="Scrollable table"><table class="border-collapse border border-black">${thead}${tbody}</table></div>`;
  },

  list: (data, _config) => {
    const { style, items, meta } = data;

    const renderItems = (items: typeof data.items, depth = 0): string => {
      if (!items || items.length === 0) return "";

      if (style === "checklist") {
        return `<div class="checklist depth-${depth}">
        ${items
          .map((item) => {
            const checked =
              ("checked" in item.meta && item.meta?.checked) ?? false;
            const nested = renderItems(item.items, depth + 1);
            return `<div class="checklist-item">
              <label>
                <input type="checkbox" ${checked ? "checked" : ""} />
                <span>${parseLatex(item.content)}</span>
              </label>
              ${nested}
            </div>`;
          })
          .join("")}
        </div>`;
      }

      const tag = style === "ordered" ? "ol" : "ul";

      // const startAttr = meta?.start ? ` start="${meta.start}"` : "";

      // const typeAttr = meta?.counterType
      //   ? ` style="--list-counter-type: ${meta.counterType};"`
      //   : "";

      return `
      <${tag} class="depth-${depth}" style="counter-reset: item ${meta?.start ? meta.start - 1 || 1 : ""}; ${meta?.counterType ? `--list-counter-type: ${meta.counterType};` : ""}">
      ${items
        .map(
          (item) =>
            `<li>
              ${parseLatex(item.content)}
              ${renderItems(item.items, depth + 1)}
            </li>`,
        )
        .join("")}
      </${tag}>`;
    };

    return `<div class="${styles.list}">${renderItems(items)}</div>`;
  },

  questionsAddCard: (data, _config) => {
    const { instanceId } = data as {
      instanceId: string;
      content: QuestionFormat;
    };
    return `<div class="questions-block-${instanceId}"></div>`;
  },

  image: (data, _config) => {
    // SVGs (viewBox only) collapse or render at the 300x150 replaced-element
    // default unless given a definite width, so tag them for the .img-svg rule.
    const storageRefPath = data.file?.storageRefFullPath;
    const storagePath =
      typeof storageRefPath === "string" ? storageRefPath : "";
    const isSvg =
      storagePath.toLowerCase().endsWith(".svg") ||
      (typeof data.url === "string" && data.url.toLowerCase().includes(".svg"));
    const width = typeof data.width === "number" ? data.width : undefined;
    const imageConditions = `${data.stretched && width === undefined ? "img-fullwidth" : ""} ${
      data.withBorder ? "img-border" : ""
    } ${data.withBackground ? "img-bg" : ""} ${data.centerImage ? "img-center" : ""} ${isSvg ? "img-svg" : ""}`;
    const widthStyle = width !== undefined ? ` style="width:${width}%;max-width:100%;"` : "";
    const imgClass = _config.image.imgClass ?? "";
    let imageSrc;

    if (data.url) {
      // simple-image was used and the image probably is not uploaded to this server
      // therefore, we use the absolute path provided in data.url
      // so, _config.image.path property is useless in this case!
      imageSrc = data.url;
    } else if (_config.image.path === "absolute") {
      imageSrc = data.file?.url;
    } else {
      imageSrc = _config.image.path?.replace(
        /<(.+)>/,
        (match, p1: string) => data.file?.[p1] ?? "",
      );
    }

    // Prefer richCaption for the figcaption body; fall back to plain caption.
    const rich = (data as { richCaption?: unknown }).richCaption;
    let captionBody = "";
    if (Array.isArray(rich) && rich.length > 0) {
      captionBody = renderRichCaptionToHtml(coerceRichCaption(rich));
    } else if (typeof data.caption === "string" && data.caption.length > 0) {
      captionBody = decodeEntities(data.caption);
    }
    const rawAltText =
      typeof data.altText === "string"
        ? data.altText
        : typeof data.caption === "string"
          ? data.caption
          : "";
    const altText = rawAltText
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    if (_config.image.use === "img") {
      return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${altText}"${widthStyle}>`;
    } else if (_config.image.use === "figure") {
      const figureClass = _config.image.figureClass ?? "";
      const figCapClass = _config.image.figCapClass ?? "";

      return `<figure class="${figureClass}"><img class="${imgClass} ${imageConditions}" src="${imageSrc}" alt="${altText}"${widthStyle}><figcaption class="${figCapClass}">${captionBody}</figcaption></figure>`;
    }
    return "ERROR DISPLAYING IMAGE";
  },
};

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

  const markup = useMemo(() => {
    if (!props.content) return "";
    const parser = new edjsParser(undefined, customParsers);
    return props.content.blocks
      .map((block) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const blockMarkup = parser.parseBlock(block);
        if (blockMarkup instanceof Error) return "";

        const alignment = ALIGNABLE_TYPES.has(block.type)
          ? sanitizeAlignment(block.tunes?.alignment)
          : undefined;

        return alignment && alignment !== "left"
          ? `<div style="text-align:${alignment}">${blockMarkup}</div>`
          : blockMarkup;
      })
      .join("");
  }, [props.content]);

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
      className="prose before:prose-code:content-none after:prose-code:content-none"
      dangerouslySetInnerHTML={html}
    ></article>
  );
};

export default Renderer;
