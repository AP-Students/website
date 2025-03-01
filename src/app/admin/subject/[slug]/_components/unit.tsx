"use client";

import React, { useState, memo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash,
  MoveUp,
  MoveDown,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Unit, Chapter, UnitTest } from "@/types/firestore";
import short from "short-uuid";
import UnitTests from "./unitTests";
import ChapterContent from "./chapterContent";
import { Input } from "@/components/ui/input";

const translator = short(short.constants.flickrBase58);

function generateShortId() {
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = translator.new().slice(0, 4);
  return timestamp + randomPart;
}

interface UnitComponentProps {
  unit: Unit;
  index: number;
  onChange: (unitId: string, updatedUnit: Unit) => void;
  onDelete: (unitId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  subjectSlug: string;
}

/**
 * Renders a single Unit, including chapters and tests, but
 * extracts the "tests" section into a <UnitTests> component.
 */
function UnitComponent({
  unit,
  index,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  subjectSlug,
}: UnitComponentProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  // Local edit state for unit title
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [localUnitTitle, setLocalUnitTitle] = useState<string>(unit.title);

  // For adding new chapter
  const [newChapterTitle, setNewChapterTitle] = useState<string>("");

  // Local copies
  const [chapters, setChapters] = useState<Chapter[]>(unit.chapters);
  const [tests, setTests] = useState<UnitTest[]>(unit.tests ?? []);

  /**********************************************
   *      UPDATE PARENT
   **********************************************/
  const updateParent = (updatedUnit: Unit) => {
    onChange(unit.id, updatedUnit);
  };

  /**********************************************
   *      UNIT TITLE
   **********************************************/
  const handleUnitTitleBlur = () => {
    setEditingTitle(false);
    if (localUnitTitle.trim().length === 0) {
      alert("Unit title cannot be empty.");
      setLocalUnitTitle(unit.title);
      return;
    }
    // If changed, notify parent
    if (localUnitTitle !== unit.title) {
      const updatedUnit: Unit = {
        ...unit,
        title: localUnitTitle,
        chapters,
        tests,
      };
      updateParent(updatedUnit);
    }
  };

  /**********************************************
   *      CHAPTER ACTIONS
   **********************************************/
  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const newChapter: Chapter = {
      id: generateShortId(),
      title: newChapterTitle.trim(),
    };
    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    setNewChapterTitle("");

    const updatedUnit: Unit = {
      ...unit,
      title: localUnitTitle,
      chapters: updatedChapters,
      tests,
    };
    updateParent(updatedUnit);
  };

  const handleChapterDelete = (chapterId: string) => {
    if (
      !confirm(
        "This takes permanent effect once changes are saved. Delete chapter?",
      )
    )
      return;
    const updatedChapters = chapters.filter((c) => c.id !== chapterId);
    setChapters(updatedChapters);

    const updatedUnit: Unit = {
      ...unit,
      title: localUnitTitle,
      chapters: updatedChapters,
      tests,
    };
    updateParent(updatedUnit);
  };

  const handleChapterUpdate = (chapterId: string, newTitle: string) => {
    const updatedChapters = chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, title: newTitle } : ch,
    );
    setChapters(updatedChapters);

    const updatedUnit: Unit = {
      ...unit,
      title: localUnitTitle,
      chapters: updatedChapters,
      tests,
    };
    updateParent(updatedUnit);
  };

  /**********************************************
   *      TEST ACTIONS
   **********************************************/
  const handleTestAdd = (name: string, time: number) => {
    const newT: UnitTest = {
      id: generateShortId(),
      name,
      questions: [],
      time,
      directions:
        "Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).  All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
    };
    const updatedTests = [...tests, newT];
    setTests(updatedTests);

    const updatedUnit: Unit = {
      ...unit,
      title: localUnitTitle,
      chapters,
      tests: updatedTests,
    };
    updateParent(updatedUnit);
  };

  const handleTestUpdate = (testId: string, newName: string) => {
    const updatedTests = tests.map((t) =>
      t.id === testId ? { ...t, name: newName } : t,
    );
    setTests(updatedTests);

    const updatedUnit: Unit = {
      ...unit,
      title: localUnitTitle,
      chapters,
      tests: updatedTests,
    };
    updateParent(updatedUnit);
  };

  const handleTestDelete = (testId: string) => {
    if (
      !confirm(
        "This takes permanent effect once changes are saved. Delete test?",
      )
    )
      return;
    const updatedTests = tests.filter((t) => t.id !== testId);
    setTests(updatedTests);

    const updatedUnit: Unit = {
      ...unit,
      title: localUnitTitle,
      chapters,
      tests: updatedTests,
    };
    updateParent(updatedUnit);
  };

  return (
    <div className="rounded-lg border shadow-sm">
      {/* UNIT HEADER */}
      <div className="flex items-center pl-4">
        <MoveUp
          className="cursor-pointer transition-transform hover:scale-125"
          onClick={() => onMoveUp(index)}
        />
        <MoveDown
          className="ml-2 cursor-pointer transition-transform hover:scale-125"
          onClick={() => onMoveDown(index)}
        />
        <Edit
          onClick={() => setEditingTitle(true)}
          className="ml-4 cursor-pointer hover:text-blue-400"
        />
        <Trash
          onClick={() => onDelete(unit.id)}
          className="mx-2 cursor-pointer hover:text-red-500"
        />
        <button
          className="flex w-full items-center justify-between p-4 text-lg font-semibold"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {editingTitle ? (
            <input
              className="border border-blue-500"
              autoFocus
              value={localUnitTitle}
              onChange={(e) => setLocalUnitTitle(e.target.value)}
              onBlur={handleUnitTitleBlur}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-balance text-left">{localUnitTitle}</span>
          )}
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* UNIT BODY */}
      {expanded && (
        <div className="border-t p-4">
          {/* CHAPTERS */}
          {chapters.map((chapter, idx) => (
            <ChapterContent
              key={chapter.id}
              chapter={chapter}
              subjectSlug={subjectSlug}
              subjectSlugLink={""}
              unitId={unit.id}
              index={idx}
              onDeleteChapter={handleChapterDelete}
              onUpdateChapter={handleChapterUpdate}
            />
          ))}

          {/* ADD CHAPTER */}
          <div className="mt-4 flex gap-2">
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="New chapter title"
              className="w-1/2"
            />
            <Button
              onClick={handleAddChapter}
              className="cursor-pointer bg-green-500 hover:bg-green-600"
            >
              <PlusCircle className="mr-2" /> Add Chapter
            </Button>
          </div>

          {/* EXTRACTED TESTS SECTION */}
          <UnitTests
            unitId={unit.id}
            subjectSlug={subjectSlug}
            tests={tests}
            onTestAdd={handleTestAdd}
            onTestUpdate={handleTestUpdate}
            onTestDelete={handleTestDelete}
          />
        </div>
      )}
    </div>
  );
}

export default memo(UnitComponent);
