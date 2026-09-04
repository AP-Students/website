"use client";

import React, { memo, useState } from "react";
import RichContentEditor from "@/components/article-creator/custom_questions/RichContentEditor";
import type { ReferenceSheet } from "@/types/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface ReferenceSheetsProps {
  sheets: ReferenceSheet[];
  onAdd: (title: string) => void;
  onDelete: (sheetId: string) => void;
  onChange: (sheetId: string, updated: ReferenceSheet) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

/** Course-scoped library of natively-authored reference sheets, mirroring UnitTests' add/rename/delete/reorder list shape. */
function ReferenceSheets({
  sheets,
  onAdd,
  onDelete,
  onChange,
  onMoveUp,
  onMoveDown,
}: ReferenceSheetsProps) {
  const [newSheetTitle, setNewSheetTitle] = useState<string>("");
  const [expandedSheetId, setExpandedSheetId] = useState<string | null>(null);
  const [sheetsAutoAnimateParent] = useAutoAnimate();

  const handleAddSheet = () => {
    if (!newSheetTitle.trim()) return;
    onAdd(newSheetTitle.trim());
    setNewSheetTitle("");
  };

  const handleRenameSheet = (sheet: ReferenceSheet, currentTitle: string) => {
    const newTitle = prompt("Enter new reference sheet title", currentTitle);
    if (newTitle && newTitle.trim().length > 0) {
      onChange(sheet.id, { ...sheet, title: newTitle.trim() });
    }
  };

  return (
    <div ref={sheetsAutoAnimateParent}>
      {sheets.map((sheet, index) => {
        const isExpanded = expandedSheetId === sheet.id;

        return (
          <div
            key={sheet.id}
            className="mb-3 rounded-sm ring-gray-300 ring-offset-2 transition-[box-shadow] hover:ring-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="grid">
                <button onClick={() => onMoveUp(index)} title="Move sheet up">
                  <ArrowUp className="rounded-tl-sm hover:bg-gray-200" />
                </button>
                <button
                  onClick={() => onMoveDown(index)}
                  title="Move sheet down"
                >
                  <ArrowDown className="rounded-bl-sm hover:bg-gray-200" />
                </button>
              </div>

              <p
                onDoubleClick={() => handleRenameSheet(sheet, sheet.title)}
                className="w-full cursor-pointer rounded-sm p-1.5 leading-none hover:bg-accent"
              >
                {sheet.title || "Untitled Reference Sheet"}
              </p>

              <Button
                variant="outline"
                className="whitespace-nowrap"
                onClick={() =>
                  setExpandedSheetId(isExpanded ? null : sheet.id)
                }
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1" /> Close
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1" /> Edit Content
                  </>
                )}
              </Button>

              <Button
                className="ml-auto mr-1 aspect-square rounded-md p-0"
                variant="destructive"
                onClick={() => onDelete(sheet.id)}
              >
                <Trash2 />
              </Button>
            </div>

            {isExpanded && (
              <div className="mt-2 rounded border p-3">
                <RichContentEditor
                  value={sheet.content}
                  onChange={(content) => onChange(sheet.id, { ...sheet, content })}
                  placeholder="Formulas, constants, unit conversions, definitions..."
                />
              </div>
            )}
          </div>
        );
      })}

      {/* ADD REFERENCE SHEET */}
      <div className="mt-4 flex gap-2">
        <Input
          value={newSheetTitle}
          onChange={(e) => setNewSheetTitle(e.target.value)}
          placeholder="New reference sheet title"
          className="w-1/2"
        />
        <Button
          onClick={handleAddSheet}
          className="bg-green-500 hover:bg-green-600"
          disabled={!newSheetTitle.trim()}
        >
          <Plus className="-ml-1 mr-2" /> Add Reference Sheet
        </Button>
      </div>
    </div>
  );
}

export default memo(ReferenceSheets);
