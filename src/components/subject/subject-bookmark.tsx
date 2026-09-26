"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useUser } from "@/components/hooks/UserContext";
import { clearUserCache } from "@/components/hooks/users";
import { updateMySubjects } from "@/lib/manageUser";
import { cn } from "@/lib/utils";

export default function SubjectBookmark({ slug }: { slug: string }) {
  const { user, updateUser } = useUser();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const mySubjects = user.mySubjects ?? [];
  const isSaved = mySubjects.includes(slug);

  const toggleSaved = async () => {
    setSaving(true);
    try {
      const updated = isSaved
        ? mySubjects.filter((s) => s !== slug)
        : [...mySubjects, slug];
      await updateMySubjects(user.uid, updated);
      clearUserCache();
      await updateUser();
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSaved}
      disabled={saving}
      aria-label={isSaved ? "Remove from My Classes" : "Add to My Classes"}
      aria-pressed={isSaved}
      title={isSaved ? "Remove from My Classes" : "Add to My Classes"}
      className="focus-visible:outline-none shrink-0 transition-opacity focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
    >
      <Bookmark
        strokeWidth={1.5}
        className={cn(
          "h-12 w-12",
          isSaved ? "fill-primary text-primary" : "text-gray-800",
        )}
      />
    </button>
  );
}
