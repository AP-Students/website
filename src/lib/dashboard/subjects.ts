import { sectionData } from "@/components/landingPage/APLibrary";
import { formatSlug } from "@/lib/utils";

export const toSlug = (course: string) =>
  formatSlug(course.replace(/AP /g, ""));

export function findCourse(slug: string) {
  const normalized = slug.replace(/^ap-/, "");
  for (const section of sectionData) {
    for (const course of section.courses) {
      if (toSlug(course) === normalized) {
        return { name: course, color: section.borderColor };
      }
    }
  }
  return null;
}
