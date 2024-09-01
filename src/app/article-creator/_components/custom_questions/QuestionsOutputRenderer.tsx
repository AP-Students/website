import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { QuestionsOutput } from "./QuestionInstance";

const QuestionsBlockRenderer = ({ instanceId }: { instanceId: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const root = createRoot(containerRef.current);
      root.render(<QuestionsOutput instanceId={instanceId} />);

      // Cleanup on component unmount
      return () => {
        root.unmount();
      };
    }
  }, [instanceId]);

  return <div ref={containerRef} className={`questions-block-${instanceId}`}></div>;
};

export default QuestionsBlockRenderer;
