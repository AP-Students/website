import type { FRQSubmission } from "@/types/frq";

type FRQGradingRendererProps = {
  frq: FRQSubmission | null;
};

const FRQGradingRenderer = ({ frq }: FRQGradingRendererProps) => {
  if (!frq) {
    return <div>FRQ not found.</div>;
  }

  return <div>FRQ found. Grading page loaded successfully.</div>;
};

export default FRQGradingRenderer;