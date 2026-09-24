import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { sectionData } from "@/components/landingPage/APLibrary";
import { formatSlug } from "@/lib/utils";
import { useState } from "react";
import { updateMySubjects } from "@/lib/manageUser";
import { clearUserCache } from "@/components/hooks/users";
import { useUser } from "@/components/hooks/UserContext";
import { Button } from "@/components/ui/button";

const toSlug = (course: string) => formatSlug(course.replace(/AP /g, ""));


function findCourse(slug: string) {
  for (const section of sectionData) {
    for (const course of section.courses) {
      if (toSlug(course) === slug) {
        return { name: course, color: section.borderColor };
      }
    }
  }
  return null;
}

export default function MyClasses({ uid, subjectSlugs }: { uid:string; subjectSlugs: string[] }) {
  const { updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setSelected(subjectSlugs); 
    setError(null);
    setIsEditing(true);
  };

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMySubjects(uid, selected);
      clearUserCache();
      await updateUser();
      setIsEditing(false);
    } catch {
      setError("Couldn't save your classes. Please try again.");
    } finally {
      setSaving(false);
    }
  };  
  
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
      <h2 className="mb-3 text-2xl font-bold">My Classes:</h2>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-4 rounded-lg border border-gray-300 bg-white p-4 shadow">
          {sectionData.map((section) => (
            <div key={section.title}>
              <h3
                className="mb-2 font-semibold"
                style={{ color: section.borderColor }}
              >
                {section.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.courses.map((course) => {
                  const slug = toSlug(course);
                  const isOn = selected.includes(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggle(slug)}
                      className="rounded-full border px-3 py-1 text-sm transition-colors"
                      style={
                        isOn
                          ? { backgroundColor: section.borderColor, borderColor: section.borderColor, color: "white" }
                          : { borderColor: `${section.borderColor}80`, color: section.borderColor }
                      }
                    >
                      {course}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : subjectSlugs.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t added any classes yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {subjectSlugs.map((slug) => {
            const course = findCourse(slug);
            if (!course) return null;

            return (
              <Link
                key={slug}
                href={`/subject/${slug}`}
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-lg font-bold transition-shadow hover:shadow-md"
                style={{ color: course.color, borderColor: `${course.color}80` }}
              >
                {course.name}
                <ChevronRight />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}