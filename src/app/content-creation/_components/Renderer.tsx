import { type OutputData } from "@editorjs/editorjs";
import edjsParser from "editorjs-parser";
import katex from "katex";

const customParsers = {
  math: (data: { text: string }) => {
    // https://github.com/flaming-cl/editorjs-math/blob/master/src/index.js
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return katex.renderToString(data.text, {
      output: "html",
      throwOnError: true,
      displayMode: true,
    });
  },

  delimiter: () => {
    return "<hr />";
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
};

const Renderer = (props: { content: OutputData }) => {
  if (!props.content) return null;

  // @ts-expect-error customParsers is correct but TS doesn't know that
  const parser = new edjsParser({}, customParsers);
  const markup = parser.parse(props.content);

  return (
    <article
      className="prose"
      dangerouslySetInnerHTML={{
        __html: markup,
      }}
    ></article>
  );
};

export default Renderer;
