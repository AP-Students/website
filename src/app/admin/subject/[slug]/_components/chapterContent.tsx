"use client";

import React, { memo, useState } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/types/firestore";
import { Link } from "../../link";

interface ChapterComponentProps {
  chapter: Chapter;
  index: number; // for display if needed
  unitId: string; // if you need the unit ID
  subjectSlug: string; // if you need the subject slug
  subjectSlugLink: string; // an example link if you want
  onDeleteChapter: (chapterId: string) => void;
  onUpdateChapter: (chapterId: string, newTitle: string) => void;
  setChapterVisibility: (chapterId: string, isPublic: boolean) => void;
  moveChapterUp: (chapterId: string) => void;
  moveChapterDown: (chapterId: string) => void;
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
  setChapterVisibility,
  moveChapterUp,
  moveChapterDown,
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
    <div className="mb-3 flex items-center justify-between gap-2 rounded-sm ring-gray-300 ring-offset-2 transition-[box-shadow] hover:ring-2">
      <div className="grid">
        <button
          onClick={() => moveChapterUp(chapter.id)}
          title="Move chapter up"
        >
          <ArrowUp className="rounded-tl-sm hover:bg-gray-200" />
        </button>
        <button
          onClick={() => moveChapterDown(chapter.id)}
          title="Move chapter down"
        >
          <ArrowDown className="rounded-bl-sm hover:bg-gray-200" />
        </button>
      </div>
      <div className="grid">
        <label htmlFor={`visibility-${chapter.id}`}>Public</label>
        <input
          type="checkbox"
          id={`visibility-${chapter.id}`}
          checked={chapter.isPublic}
          onChange={(e) => setChapterVisibility(chapter.id, e.target.checked)}
        />
      </div>

      <Link
        className="whitespace-nowrap rounded-full border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        href={`/admin/subject/${subjectSlug}/${unitId}/chapter/${chapter.id}`}
      >
        Edit Chapter {index + 1}
      </Link>

      {/* Chapter title: double click to edit */}
      {editing ? (
        <input
          className="w-full p-1.5"
          autoFocus
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
        />
      ) : (
        <p
          onDoubleClick={() => setEditing(true)}
          className="w-full cursor-pointer rounded-sm p-1.5 leading-none hover:bg-accent"
        >
          {localTitle}
        </p>
      )}

      <Button
        className="ml-auto mr-1 aspect-square rounded-md p-0"
        variant="destructive"
        onClick={() => onDeleteChapter(chapter.id)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

// memo() helps avoid rerenders if props haven't changed
export default memo(ChapterComponent);
