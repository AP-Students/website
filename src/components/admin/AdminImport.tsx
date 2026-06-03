"use client";
import React, { useRef, useState } from "react";
import { Upload, ClipboardCopy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditorJsonCandidate = {
  blocks: unknown[];
  time: number;
};

function isEditorJsonCandidate(value: unknown): value is EditorJsonCandidate {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.blocks) && typeof candidate.time === "number";
}

const AdminImport = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pastedJson, setPastedJson] = useState<string>("");

  const handleCopyPastedJson = async () => {
    if (!pastedJson) {
      alert("Nothing to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(pastedJson);
      alert("JSON copied to clipboard.");
    } catch (err) {
      console.error(err);
      alert("Failed to copy to clipboard.");
    }
  };

  const handleUploadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      setPastedJson(text);
    } catch (err) {
      console.error(err);
      alert("Failed to read JSON file.");
    }
  };

  const handleImportPastedJson = () => {
    if (!pastedJson.trim()) {
      alert("Paste JSON text first.");
      return;
    }

    try {
      const parsed = JSON.parse(pastedJson) as unknown;
      if (!isEditorJsonCandidate(parsed)) {
        alert("JSON appears invalid for EditorJS format.");
        return;
      }

      alert("JSON imported and validated successfully.");
      // TODO: hook up further actions (save to Firestore / open in editor)
      console.log("Imported JSON:", parsed);
    } catch (err) {
      console.error(err);
      alert("Failed to parse pasted JSON.\n" + String(err));
    }
  };

  return (
    <div className="mb-4 rounded-lg border p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={cn(buttonVariants({ variant: "outline" }), "rounded-sm pl-3")}
          onClick={handleCopyPastedJson}
          type="button"
        >
          <ClipboardCopy className="mr-1" />
          Copy Data to Clipboard
        </button>

        <button
          className={cn(buttonVariants({ variant: "outline" }), "rounded-sm pl-3")}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload className="mr-1" />
          Upload JSON
        </button>
      </div>

      <input
        accept="application/json,.json"
        className="hidden"
        onChange={handleUploadJson}
        ref={fileInputRef}
        type="file"
      />

      <label className="mb-2 block text-sm font-medium" htmlFor="admin-pasted-json">
        Paste raw Editor JSON
      </label>
      <textarea
        id="admin-pasted-json"
        className="min-h-40 w-full rounded-sm border p-2 font-mono text-xs"
        placeholder='Paste JSON from "Copy Data to Clipboard" here'
        value={pastedJson}
        onChange={(e) => setPastedJson(e.target.value)}
      />

      <div className="mt-2 flex justify-end">
        <button
          className={cn(buttonVariants({ variant: "outline" }), "rounded-sm")}
          onClick={handleImportPastedJson}
          type="button"
        >
          Import Pasted JSON
        </button>
      </div>
    </div>
  );
};

export default AdminImport;

