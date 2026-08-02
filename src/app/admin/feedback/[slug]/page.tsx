import FeedbackDetailsClient from './FeedbackDetailsClient';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function FeedbackDetailsPage({ params }: PageProps) {
  return <FeedbackDetailsClient slug={params.slug} />;
}