"use client";

import React, { memo, useState } from "react";
import Link from "next/link";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/types/firestore";
import { Input } from "@/components/ui/input";

interface ChapterComponentProps {
  chapter: Chapter;
  index: number; // for display if needed
  unitId: string; // if you need the unit ID
  subjectSlug: string; // if you need the subject slug
  subjectSlugLink: string; // an example link if you want
  onDeleteChapter: (chapterId: string) => void;
  onUpdateChapter: (chapterId: string, newTitle: string) => void;
}

/**
 * Renders a single Chapter row with "Delete" and "Edit".
 */
function ChapterComponent({
  chapter,
  index,
  unitId,
  subjectSlug,
  onDeleteChapter,
  onUpdateChapter,
}: ChapterComponentProps) {
  const [editing, setEditing] = useState<boolean>(false);
  const [localTitle, setLocalTitle] = useState<string>(chapter.title);

  const handleBlur = () => {
    setEditing(false);
    if (localTitle.trim().length === 0) {
      alert("Title cannot be empty.");
      setLocalTitle(chapter.title);
      return;
    }
    // If changed, notify parent
    if (localTitle !== chapter.title) {
      onUpdateChapter(chapter.id, localTitle);
    }
  };

  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      {/* Example "Edit Content" link (adjust URL as needed) */}
      <Link
        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium hover:bg-slate-100"
        href={`/admin/subject/${subjectSlug}/${unitId}/chapter/${chapter.id}`}
      >
        Edit Content
      </Link>

      {/* Chapter title: double click to edit */}
      {editing ? (
        <>
          <p className="text-nowrap px-2">Chapter {index + 1}:</p>
          <Input
            className="-ml-5 w-full border border-blue-500"
            autoFocus
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
          />
        </>
      ) : (
        <p
          onDoubleClick={() => setEditing(true)}
          className="w-full cursor-pointer rounded-sm px-2 py-1 hover:bg-accent"
        >
          Chapter {index + 1}: {localTitle}
        </p>
      )}

      {/* Delete chapter button */}
      <Button
        className="ml-auto"
        variant={"destructive"}
        onClick={() => onDeleteChapter(chapter.id)}
      >
        <Trash />
      </Button>
    </div>
  );
}

// memo() helps avoid rerenders if props haven't changed
export default memo(ChapterComponent);
