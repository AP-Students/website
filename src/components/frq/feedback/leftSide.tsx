



//----------------------------------------------------------------------
//REVIEW THIS ENTIRE THING
//----------------------------------------------------------------------








import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import type { QuestionInput } from "@/types/questions";

interface DescriptionPanelProps {
  description: QuestionInput;
}

export default function DescriptionPanel({
  description,
}: DescriptionPanelProps) {
  return (
    <section className="h-full overflow-y-auto px-16 py-10">
      <RenderContent content={description} origin="content" />
    </section>
  );
}