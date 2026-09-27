"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  listSavedItems,
  unsaveItem,
  type SavedItemWithId,
} from "@/lib/savedItems";

/** The user's saved readings and problems, newest first, with remove. */
export default function SavedItemsList({ uid }: { uid: string }) {
  const [items, setItems] = useState<SavedItemWithId[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listSavedItems(uid)
      .then(setItems)
      .catch((error) => {
        console.error("Error loading saved items:", error);
        setFailed(true);
      });
  }, [uid]);

  const remove = async (id: string) => {
    try {
      await unsaveItem(uid, id);
      setItems((prev) => prev?.filter((item) => item.id !== id) ?? null);
    } catch (error) {
      console.error("Error removing saved item:", error);
      toast.error("Couldn't remove this item. Please try again.");
    }
  };

  if (failed) {
    return (
      <p className="text-sm text-red-600">Couldn&apos;t load saved items.</p>
    );
  }
  if (!items) return <p className="text-sm text-gray-500">Loading…</p>;
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nothing saved yet. Use the Save button on a reading or problem.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 p-3">
          <span className="w-16 shrink-0 text-xs font-medium uppercase text-gray-500">
            {item.kind === "reading" ? "Reading" : "Problem"}
          </span>
          <Link
            href={item.path}
            className="flex-1 truncate text-blue-600 hover:underline"
          >
            {item.title}
          </Link>
          <button
            type="button"
            onClick={() => void remove(item.id)}
            className="shrink-0 text-sm text-gray-500 hover:text-red-600"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
