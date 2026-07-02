import type { OutputData } from "@editorjs/editorjs";
import type { BlockData, Config } from "editorjs-parser";
import edjsParser from "editorjs-parser";
import { decode } from "html-entities";
import katex from "katex";
import "katex/contrib/mhchem";
import hljs from "highlight.js";
import "@/styles/highlightjs.css";
import type { QuestionFormat } from "@/types/questions";
import "@/styles/katexStyling.css";
import styles from "./Renderer.module.css";

// DOM-free entity decoder so this module can run during server rendering.
// Previously this used `document.createElement("textarea")`, which kept the
// whole renderer client-only. `html-entities` decodes named + numeric entities
// without a DOM.
export function decodeEntities(str: string): string {
  return decode(str);
}

export const katexMacros = {
  "\\unit": "\\,\\mathrm{#1}",
  "\\qty": "#1\\,\\mathrm{#2}",
};

// derived from advancedtextbox
function parseLatex(text: string): string {
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
      return part;
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
          (acc, cell) => acc + `<th>${parseLatex(cell)}</th>`,
          "",
        )}</tr>`;
      }

      // For other rows, use <td> tags
      return `<tr class="divide-x-[1px]">${row.reduce(
        (acc, cell) => acc + `<td>${parseLatex(cell)}</td>`,
        "",
      )}</tr>`;
    });
    const thead = withHeadings ? `<thead>${rows.shift()}</thead>` : "";
    const tbody = `<tbody>${rows.join("")}</tbody>`;

    return `<table>${thead}${tbody}</table>`;
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
    const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${
      data.withBorder ? "img-border" : ""
    } ${data.withBackground ? "img-bg" : ""} ${data.centerImage ? "img-center" : ""} ${isSvg ? "img-svg" : ""}`;
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

    if (_config.image.use === "img") {
      return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${data.caption}">`;
    } else if (_config.image.use === "figure") {
      const figureClass = _config.image.figureClass ?? "";
      const figCapClass = _config.image.figCapClass ?? "";

      return `<figure class="${figureClass}"><img class="${imgClass} ${imageConditions}" src="${imageSrc}" alt="${data.caption}"><figcaption class="${figCapClass}">${data.caption}</figcaption></figure>`;
    }
    return "ERROR DISPLAYING IMAGE";
  },
};

/**
 * Parses EditorJS `OutputData` into an HTML string. Pure and DOM-free, so it runs
 * both server-side (public chapter SSR) and client-side (gated chapters via
 * `Renderer`). Question cards render as empty `.questions-block-<id>` placeholders
 * that `QuestionsHydrator` mounts interactive components into on the client.
 */
export function renderEditorJsToHtml(content: OutputData): string {
  const parser = new edjsParser(undefined, customParsers);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return parser.parse(content);
}
