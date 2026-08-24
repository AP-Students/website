import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import type { QuestionInput } from "@/types/questions";

interface DescriptionPanelProps {
  description: QuestionInput;
  stimulus?: QuestionInput;
}

export default function DescriptionPanel({
  description,
  stimulus,
}: DescriptionPanelProps) {
  // `normalizeFrqTemplate` stores an unauthored stimulus as "", not as absent,
  // so this cannot lean on `??`. Files are checked separately because a
  // stimulus can be an image with no accompanying text.
  const hasStimulus =
    Boolean(stimulus?.value.trim()) || (stimulus?.files.length ?? 0) > 0;

  return (
    <section className="h-full overflow-y-auto px-16 py-8">
      <RenderContent content={description} origin="content" />

      {/*
        Stacked under the exam-wide directions rather than replacing them, the
        way the test page shows the same two fields. Both can be authored, and
        a student reading their feedback needs whatever they read while sitting
        the exam.
      */}
      {hasStimulus && stimulus && (
        <div className="mt-8 border-t border-gray-300 pt-8">
          <RenderContent content={stimulus} origin="content" />
        </div>
      )}
    </section>
  );
}
