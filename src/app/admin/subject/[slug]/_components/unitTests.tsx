"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import type { UnitTest } from "@/types/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, PlusCircle } from "lucide-react";

interface UnitTestsProps {
  unitId: string;
  subjectSlug: string;         // If you want to build a dynamic link based on the subject slug
  tests: UnitTest[];
  onTestUpdate: (testId: string, newName: string) => void;
  onTestDelete: (testId: string) => void;
  onTestAdd: (name: string, time: number) => void;
}

function UnitTests({
  unitId,
  subjectSlug,
  tests,
  onTestUpdate,
  onTestDelete,
  onTestAdd,
}: UnitTestsProps) {
  // Local state for adding a new test
  const [newTestName, setNewTestName] = useState<string>("");
  const [newTestTime, setNewTestTime] = useState<string>("0");

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
    <div className="mt-8">
      <h3 className="text-xl font-semibold">Unit Tests</h3>

      {tests.map((test, testIdx) => (
        <div
          key={test.id}
          className="mb-3 flex items-center justify-between gap-4"
        >
          {/* Example Link to test editor (adjust as needed) */}
          <Link
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium hover:bg-slate-100"
            href={`/admin/subject/${subjectSlug}/${unitId}/test/${test.id}`}
          >
            Edit Test
          </Link>

          <p
            onDoubleClick={() => handleRenameTest(test.id, test.name!)}
            className="w-full cursor-pointer rounded-sm px-2 py-1 hover:bg-accent"
          >
            Test {testIdx + 1}: {test.name}
            {test.time ? ` - ${test.time} mins` : ""}
          </p>

          <Button
            className="ml-auto"
            variant="destructive"
            onClick={() => onTestDelete(test.id)}
          >
            <Trash />
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
        <Input
          type="number"
          value={newTestTime}
          onChange={(e) => setNewTestTime(e.target.value)}
          placeholder="0"
          className="w-20"
        />
        <Button
          onClick={handleAddTest}
          className="cursor-pointer bg-green-500 hover:bg-green-600"
        >
          <PlusCircle className="mr-2" /> Add Test
        </Button>
      </div>
    </div>
  );
}

export default memo(UnitTests);
