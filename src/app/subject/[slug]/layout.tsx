import { type Metadata } from "next";
import { getSubjectTitle } from "@/lib/sitemap-data";

// Server layout for every page under /subject/[slug]. Its only job is to attach
// real per-subject metadata (title, description, canonical, OpenGraph) so
// crawlers and AI assistants can disambiguate subjects instead of seeing the
// generic global title. The nested (sidebar)/(no-sidebar) client layouts and
// pages render unchanged inside it.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const name = (await getSubjectTitle(params.slug)) ?? "AP Subject";
  const title = `${name} Study Guide & Notes`;
  const description = `Free ${name} study guides, unit-by-unit notes, and practice questions written by students who aced the exam. Review every unit of ${name} on FiveHive.`;
  const url = `/subject/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${title} | FiveHive`,
      description,
      url,
    },
  };
}

export default function SubjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
