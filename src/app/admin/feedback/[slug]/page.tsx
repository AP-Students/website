import FeedbackDetailsClient from './FeedbackDetailsClient';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function FeedbackDetailsPage({ params }: PageProps) {
  const config = {
    gitHubAccessToken: process.env.GITHUB_ACCESS_TOKEN ?? '',
    gitHubRepoOwner: process.env.GITHUB_REPO_OWNER ?? '',
    gitHubRepoName: process.env.GITHUB_REPO_NAME ?? '',
  };

  return <FeedbackDetailsClient slug={params.slug} config={config} />;
}