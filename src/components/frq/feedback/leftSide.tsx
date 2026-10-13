import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import type { QuestionInput } from "@/types/questions";

interface DescriptionPanelProps {
  /**
   * Passed only for a legacy document, whose directions are its stimulus.
   * Anything newer shows its directions behind the header toggle, as the test
   * page does.
   */
  directions?: QuestionInput;
  /** Passed only when it would put something on screen. */
  stimulus?: QuestionInput;
}

export default function DescriptionPanel({
  directions,
  stimulus,
}: DescriptionPanelProps) {
  return (
    <section className="h-full overflow-y-auto px-16 py-8">
      {directions && <RenderContent content={directions} origin="content" />}

      {stimulus && (
        <div className={directions ? "mt-8 border-t border-gray-300 pt-8" : ""}>
          <RenderContent content={stimulus} origin="content" />
        </div>
      )}
    </section>
  );
}
