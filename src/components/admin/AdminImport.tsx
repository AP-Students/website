"use client";
import React, { useRef, useState } from "react";
import { Upload, ClipboardCopy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditorJsBlock = {
  id: string;
  type: string;
  data: {
    instanceId?: string;
    [key: string]: unknown;
  };
};

type EditorJsonCandidate = {
  blocks: EditorJsBlock[];
  time: number;
};

function isEditorJsonCandidate(value: unknown): value is EditorJsonCandidate {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.blocks) && typeof candidate.time === "number";
}

const generateBlockId = (): string => Math.random().toString(36).substring(2, 12);

const generateUuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const AdminImport = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pastedJson, setPastedJson] = useState<string>("");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const showStatus = (type: "success" | "error", message: string) => {
    setStatus({ type, message });
  };

  const handleCopyPastedJson = async () => {
    if (!pastedJson) {
      showStatus("error", "Nothing to copy.");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pastedJson);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = pastedJson;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      showStatus("success", "JSON copied to clipboard.");
    } catch (err) {
      console.error(err);
      showStatus("error", "Failed to copy to clipboard.");
    }
  };

  const handleUploadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      setPastedJson(text);
      showStatus("success", `File "${file.name}" loaded successfully.`);
    } catch (err) {
      console.error(err);
      showStatus("error", "Failed to read JSON file.");
    }
  };

  const handleImportPastedJson = () => {
    if (!pastedJson.trim()) {
      showStatus("error", "Paste JSON text first.");
      return;
    }

    try {
      const parsed = JSON.parse(pastedJson) as unknown;
      if (!isEditorJsonCandidate(parsed)) {
        showStatus("error", "JSON appears invalid for EditorJS format.");
        return;
      }

      // Re-map the blocks to decouple original ids and instanceIds
      const decoupledBlocks = parsed.blocks.map((block) => ({
        ...block,
        id: generateBlockId(),
        data: {
          ...block.data,
          ...(block.data?.instanceId ? { instanceId: generateUuid() } : {}),
        },
      }));

      const finalImportedData: EditorJsonCandidate = {
        ...parsed,
        blocks: decoupledBlocks,
      };

      // Set state to the decoupled payload so it's ready to use or copy
      setPastedJson(JSON.stringify(finalImportedData, null, 2));
      showStatus("success", "JSON imported and validated successfully. New independent block IDs and instanceIds assigned!");
      console.log("Imported JSON with decoupled IDs:", finalImportedData);
    } catch (err) {
      console.error(err);
      showStatus("error", "Failed to parse pasted JSON.\n" + String(err));
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

      {status.type && (
        <div
          className={cn(
            "mb-4 rounded p-2 text-xs font-medium border",
            status.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          )}
        >
          {status.message}
        </div>
      )}

      <label className="mb-2 block text-sm font-medium" htmlFor="admin-pasted-json">
        Paste raw Editor JSON
      </label>
      <textarea
        id="admin-pasted-json"
        className="min-h-40 w-full rounded-sm border p-2 font-mono text-xs"
        placeholder='Paste JSON from "Copy Data to Clipboard" here'
        value={pastedJson}
        onChange={(e) => {
          setPastedJson(e.target.value);
          if (status.type) setStatus({ type: null, message: "" });
        }}
      />

      <div className="mt-2 flex justify-end">
        <button
          className={cn(buttonVariants({ variant: "outline" }), "rounded-sm")}
          onClick={handleImportPastedJson}
          type="button"
        >
          Validate Pasted JSON
        </button>
      </div>
    </div>
  );
};

export default AdminImport;