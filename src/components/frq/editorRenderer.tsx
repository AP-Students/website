interface FRQEditorRendererProps {
  frqFound: boolean;
}

const FRQEditorRenderer = ({
  frqFound,
}: FRQEditorRendererProps) => {
  return (
    <div>
      {frqFound
        ? "FRQ loaded successfully."
        : "Failed to load FRQ."}
    </div>
  );
};

export default FRQEditorRenderer;
