"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { sectionData } from "@/components/landingPage/APLibrary";
import { useState } from "react";
import { updateMySubjects } from "@/lib/manageUser";
import { Button } from "@/components/ui/button";
import { findCourse, toSlug } from "@/lib/dashboard/subjects";
import { useClassProgress } from "@/components/hooks/useClassProgress";

export default function MyClasses({
  uid,
  subjectSlugs,
}: {
  uid: string;
  subjectSlugs: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { progress, error: progressError } = useClassProgress(
    uid,
    subjectSlugs,
  );

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
        <h2 className="text-2xl font-bold">My Classes:</h2>
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
                      className="rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={
                        isOn
                          ? {
                              backgroundColor: section.borderColor,
                              borderColor: section.borderColor,
                              color: "white",
                            }
                          : {
                              borderColor: `${section.borderColor}80`,
                              color: section.borderColor,
                            }
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
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
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
            const classProgress = progress[slug];

            return (
              <Link
                key={slug}
                href={`/subject/${slug}`}
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-lg font-bold transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  color: course.color,
                  borderColor: `${course.color}80`,
                }}
              >
                <span className="flex grow flex-col gap-1">
                  {course.name}
                  {classProgress &&
                    (classProgress.total === 0 ? (
                      <span className="text-xs font-normal text-gray-500">
                        No tests yet
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          role="progressbar"
                          aria-label={`${course.name} tests done`}
                          aria-valuemin={0}
                          aria-valuemax={classProgress.total}
                          aria-valuenow={classProgress.done}
                          className="h-2 w-full max-w-48 rounded-full bg-gray-200"
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${(classProgress.done / classProgress.total) * 100}%`,
                              backgroundColor: course.color,
                            }}
                          />
                        </span>
                        <span className="whitespace-nowrap text-xs font-normal text-gray-500">
                          {classProgress.done} / {classProgress.total} tests
                        </span>
                      </span>
                    ))}
                </span>
                <ChevronRight />
              </Link>
            );
          })}
          {progressError && (
            <p className="text-sm text-red-600">
              Couldn&apos;t load your class progress. Refresh to try again.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
