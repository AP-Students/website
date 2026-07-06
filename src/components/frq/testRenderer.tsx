type FRQTestRendererProps = {
  frq: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
};

const FRQTestRenderer = ({
  frq,
  loading = false,
  error = null,
}: FRQTestRendererProps) => {
  if (loading) {
    return <p>Loading FRQ test...</p>;
  }

  if (error) {
    return <p>Failed to load FRQ test.</p>;
  }

  if (!frq) {
    return <p>FRQ test not found.</p>;
  }

  return <p>FRQ test found successfully.</p>;
};

export default FRQTestRenderer;