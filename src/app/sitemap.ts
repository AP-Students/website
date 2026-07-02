import { type MetadataRoute } from "next";
import { getAllSubjects } from "@/lib/sitemap-data";
import { formatSlug } from "@/lib/utils";

const baseUrl = "https://www.fivehive.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1 },
    { path: "/library", priority: 0.8 },
    { path: "/guides", priority: 0.8 },
    { path: "/apply", priority: 0.6 },
    { path: "/privacy", priority: 0.3 },
  ].map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));

  const subjects = (await getAllSubjects()).filter((s) => s.slug !== "porting");
  const subjectRoutes: MetadataRoute.Sitemap = [];

  for (const subject of subjects) {
    subjectRoutes.push({
      url: `${baseUrl}/subject/${subject.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });

    subject.units.forEach((unit, unitIndex) => {
      const unitSegment = `unit-${unitIndex + 1}-${unit.id}`;
      for (const chapter of unit.chapters ?? []) {
        // Only list publicly readable chapters — gated content can't be
        // crawled or cited anyway, and listing it invites thin-page penalties.
        if (chapter.isPublic) {
          subjectRoutes.push({
            url: `${baseUrl}/subject/${subject.slug}/${unitSegment}/chapter/${chapter.id}/${formatSlug(chapter.title)}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.8,
          });
        }
      }
    });
  }

  return [...staticRoutes, ...subjectRoutes];
}
