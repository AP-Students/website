import type { StudentQuestion } from "@/lib/frq/studentView";
import { getPartHeading } from "@/lib/frq/studentView";
import { stripResponseHtml } from "@/lib/frq/template";

const PRINT_STYLES = `
    body {
      margin: 40px;
      color: #111;
      font-family: Georgia, "Times New Roman", serif;
    }

    h1 {
      margin-bottom: 32px;
      text-align: center;
    }

    .response {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .response h2 {
      border-bottom: 1px solid #999;
      padding-bottom: 8px;
      font-size: 18px;
    }

    .response p {
      white-space: pre-wrap;
      line-height: 1.6;
    }
  `;

/**
 * Responses are stored as sanitized HTML, but the printed copy is plain text:
 * the print window has none of the app's styles, so markup would show up as
 * literal tags. Shares its stripping logic with `hasResponseText` rather than
 * parsing each response through its own `DOMParser` instance.
 */
const getPlainText = (html: string) => stripResponseHtml(html) || "No response";

/**
 * Open a print window holding the student's own answers. Headings name both
 * the question and the part, because part labels restart at A in every
 * question and "Part A" alone would appear several times in one document.
 */
export const downloadResponsesAsPdf = ({
  testName,
  questions,
  responses,
}: {
  testName: string;
  questions: StudentQuestion[];
  responses: Record<string, string>;
}) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    window.alert(
      "The browser blocked the PDF window. Allow pop-ups and try again.",
    );
    return;
  }

  const printDocument = printWindow.document;

  printDocument.title = `${testName} Responses`;
  printDocument.head.replaceChildren();
  printDocument.body.replaceChildren();

  const styleElement = printDocument.createElement("style");
  styleElement.textContent = PRINT_STYLES;
  printDocument.head.appendChild(styleElement);

  const pageTitle = printDocument.createElement("h1");
  pageTitle.textContent = `${testName} Responses`;
  printDocument.body.appendChild(pageTitle);

  questions.forEach((question, questionIndex) => {
    question.parts.forEach(({ part, label }) => {
      const section = printDocument.createElement("section");
      section.className = "response";

      const heading = printDocument.createElement("h2");
      heading.textContent = getPartHeading(
        questions.length,
        questionIndex,
        label,
      );

      const responseText = printDocument.createElement("p");
      responseText.textContent = getPlainText(responses[part.id] ?? "");

      section.append(heading, responseText);
      printDocument.body.appendChild(section);
    });
  });

  printWindow.focus();

  // The print dialog opens before the window has laid out its new content
  // unless it is given a tick, which produced blank first pages.
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
};
