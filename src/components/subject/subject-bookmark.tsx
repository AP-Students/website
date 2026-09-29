"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { addMySubject, removeMySubject } from "@/lib/manageUser";
import { cn } from "@/lib/utils";

export default function SubjectBookmark({ slug }: { slug: string }) {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [mySubjects, setMySubjects] = useState<string[] | null>(null);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    setMySubjects(null);
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        setMySubjects(
          (snapshot.data()?.mySubjects as string[] | undefined) ?? [],
        );
      },
      (error) => console.error("Error loading classes:", error),
    );
  }, [uid]);

  if (!user) return null;

  const isSaved = mySubjects?.includes(slug) ?? false;

  const toggleSaved = async () => {
    setSaving(true);
    try {
      if (isSaved) {
        await removeMySubject(user.uid, slug);
      } else {
        await addMySubject(user.uid, slug);
      }
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
      disabled={saving || mySubjects === null}
      aria-label={isSaved ? "Remove from My Classes" : "Add to My Classes"}
      aria-pressed={isSaved}
      title={isSaved ? "Remove from My Classes" : "Add to My Classes"}
      className="shrink-0 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
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
