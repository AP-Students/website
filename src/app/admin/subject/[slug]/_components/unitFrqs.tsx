"use client";

import { memo, useState } from "react";
import { Link } from "../../link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FRQTemplate } from "@/types/frq";

type UnitFrqsProps = {
  unitId: string;
  subjectSlug: string;
  frqs: FRQTemplate[];
  onFrqAdd: (title: string) => void;
  onFrqUpdate: (frqId: string, title: string) => void;
  onFrqVisibilityChange: (frqId: string, isPublic: boolean) => void;
};

function UnitFrqs({
  unitId,
  subjectSlug,
  frqs,
  onFrqAdd,
  onFrqUpdate,
  onFrqVisibilityChange,
}: UnitFrqsProps) {
  const [newFrqTitle, setNewFrqTitle] = useState("");

  const handleAddFrq = () => {
    const title = newFrqTitle.trim();

    if (!title) {
      return;
    }

    onFrqAdd(title);
    setNewFrqTitle("");
  };

  const handleRenameFrq = (frqId: string, currentTitle: string) => {
    const updatedTitle = window.prompt("Enter new FRQ name", currentTitle)?.trim();

    if (updatedTitle) {
      onFrqUpdate(frqId, updatedTitle);
    }
  };

  return (
    <div>
      {frqs.map((frq, index) => {
        if (!frq.id) {
          return null;
        }

        return (
          <div
            key={frq.id}
            className="mb-3 flex items-center justify-between gap-2 rounded-sm ring-gray-300 ring-offset-2 transition-[box-shadow] hover:ring-2"
          >
            <div className="grid">
              <label htmlFor={`frq-visibility-${frq.id}`}>Public</label>
              <input
                id={`frq-visibility-${frq.id}`}
                type="checkbox"
                checked={frq.isPublic ?? false}
                onChange={(event) =>
                  onFrqVisibilityChange(frq.id!, event.target.checked)
                }
              />
            </div>

            <Link
              className="whitespace-nowrap rounded-full border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={`/admin/subject/${subjectSlug}/${unitId}/frq/${frq.id}`}
            >
              Edit FRQ {index + 1}
            </Link>

            <p
              onDoubleClick={() =>
                handleRenameFrq(frq.id!, frq.title || "Untitled FRQ")
              }
              className="w-full cursor-pointer rounded-sm p-1.5 leading-none hover:bg-accent"
            >
              {frq.title || "Untitled FRQ"}
            </p>
          </div>
        );
      })}

      <div className="mt-4 flex gap-2">
        <Input
          value={newFrqTitle}
          onChange={(event) => setNewFrqTitle(event.target.value)}
          placeholder="New FRQ name"
          className="w-1/2"
        />

        <Button
          type="button"
          onClick={handleAddFrq}
          className="bg-green-500 hover:bg-green-600"
          disabled={!newFrqTitle.trim()}
        >
          <Plus className="-ml-1 mr-2" />
          Add FRQ
        </Button>
      </div>
    </div>
  );
}

export default memo(UnitFrqs);