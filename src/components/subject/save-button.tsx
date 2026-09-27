"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { isSaved, saveItem, unsaveItem } from "@/lib/savedItems";
import type { SavedItem } from "@/types/user";
import { cn } from "@/lib/utils";
import { richTextToPlainText } from "@/components/article-creator/custom_questions/richText";

/**
 * Readable title for a saved question: drops rich-text markup and simplifies
 * inline math, e.g. `$@[\text{OH}^-]$` becomes `[OH-]`.
 */
export function questionTitle(value: string): string {
  return richTextToPlainText(value)
    .replace(/\$@([^$]*)\$/g, (_, tex: string) =>
      tex
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
        .replace(/\\[a-zA-Z]+/g, "")
        .replace(/[{}^_]/g, ""),
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Save/unsave toggle for a reading or problem. Reads the signed-in user from
 * Firebase Auth directly rather than UserContext, because quiz blocks are
 * mounted as separate React roots where that context isn't available.
 *
 * Hidden when logged out and outside the public `/subject/...` pages (e.g. the
 * admin editor's preview). Give it `key={id}` wherever `id` can change.
 */
export default function SaveButton({
  id,
  kind,
  title,
  className,
}: {
  id: string;
  kind: SavedItem["kind"];
  title: string;
  className?: string;
}) {
  const [uid, setUid] = useState<string | null>(null);
  // null until the saved state is known.
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) =>
        setUid(firebaseUser?.uid ?? null),
      ),
    [],
  );

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    isSaved(uid, id)
      .then((value) => {
        if (!cancelled) setSaved(value);
      })
      .catch((error) => {
        console.error("Error checking saved item:", error);
        // Fall back to "not saved" so the button stays usable.
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, id]);

  if (!uid || typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (!path.startsWith("/subject/")) return null;

  const toggle = async () => {
    const wasSaved = saved === true;
    setBusy(true);
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        await unsaveItem(uid, id);
      } else {
        await saveItem(uid, id, {
          kind,
          title: (title.trim() || "Untitled").slice(0, 200),
          path,
        });
      }
      toast.success(wasSaved ? "Removed from saved." : "Saved.");
    } catch (error) {
      console.error("Error updating saved item:", error);
      setSaved(wasSaved);
      toast.error("Couldn't update saved items. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy || saved === null}
      aria-pressed={saved ?? false}
      title={saved ? "Remove from saved" : "Save"}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded border bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60",
        className,
      )}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
