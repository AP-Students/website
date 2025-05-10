"use client";

import React, { useState, memo } from "react";
import { Link } from "../../link";
import type { UnitTest } from "@/types/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface UnitTestsProps {
  unitId: string;
  subjectSlug: string; // If you want to build a dynamic link based on the subject slug
  tests: UnitTest[];
  onTestUpdate: (testId: string, newName: string) => void;
  onTestDelete: (testId: string) => void;
  onTestAdd: (name: string, time: number) => void;
  setTestVisibility: (testId: string, isPublic: boolean) => void;
  moveTestUp: (testId: string) => void;
  moveTestDown: (testId: string) => void;
}

function UnitTests({
  unitId,
  subjectSlug,
  tests,
  onTestUpdate,
  onTestDelete,
  onTestAdd,
  setTestVisibility,
  moveTestUp,
  moveTestDown,
}: UnitTestsProps) {
  // Local state for adding a new test
  const [newTestName, setNewTestName] = useState<string>("");
  const [newTestTime, setNewTestTime] = useState<string>("0");

  const [testsAutoAnimateParent, enableAnimations] = useAutoAnimate();

  const handleAddTest = () => {
    if (!newTestName.trim()) return;
    onTestAdd(newTestName.trim(), Number(newTestTime) || 0);
    setNewTestName("");
    setNewTestTime("0");
  };

  const handleRenameTest = (testId: string, currentName: string) => {
    const newName = prompt("Enter new test name", currentName);
    if (newName && newName.trim().length > 0) {
      onTestUpdate(testId, newName.trim());
    }
  };

  return (
    <div ref={testsAutoAnimateParent}>
      {tests.map((test, testIdx) => (
        <div
          key={test.id}
          className="mb-3 flex items-center justify-between gap-2 rounded-sm ring-gray-300 ring-offset-2 transition-[box-shadow] hover:ring-2"
        >
          <div className="grid">
            <button onClick={() => moveTestUp(test.id)} title="Move test up">
              <ArrowUp className="rounded-tl-sm hover:bg-gray-200" />
            </button>
            <button
              onClick={() => moveTestDown(test.id)}
              title="Move test down"
            >
              <ArrowDown className="rounded-bl-sm hover:bg-gray-200" />
            </button>
          </div>
          <div className="grid">
            <label htmlFor={`visibility-${test.id}`}>Public</label>
            <input
              type="checkbox"
              id={`visibility-${test.id}`}
              checked={test.isPublic}
              onChange={(e) => setTestVisibility(test.id, e.target.checked)}
            />
          </div>
          <Link
            className="whitespace-nowrap rounded-full border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            href={`/admin/subject/${subjectSlug}/${unitId}/test/${test.id}`}
          >
            Edit Test {testIdx + 1}
          </Link>

          <p
            onDoubleClick={() => handleRenameTest(test.id, test.name!)}
            className="w-full cursor-pointer rounded-sm p-1.5 leading-none hover:bg-accent"
          >
            {test.name}
          </p>

          <Button
            className="ml-auto mr-1 aspect-square rounded-md p-0"
            variant="destructive"
            onClick={() => onTestDelete(test.id)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      {/* ADD TEST */}
      <div className="mt-4 flex gap-2">
        <Input
          value={newTestName}
          onChange={(e) => setNewTestName(e.target.value)}
          placeholder="New test name"
          className="w-1/2"
        />
        <Button
          onClick={handleAddTest}
          className="bg-green-500 hover:bg-green-600"
          disabled={!newTestName.trim()}
        >
          <Plus className="-ml-1 mr-2" /> Add Test
        </Button>
      </div>
    </div>
  );
}

export default memo(UnitTests);
