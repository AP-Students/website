"use client";

import { Check, LoaderCircle, PencilLine, TriangleAlert } from "lucide-react";
import type { AutosaveStatus as AutosaveStatusValue } from "@/lib/autosave";
import { cn } from "@/lib/utils";

/**
 * The save state every admin editor shows beside its Save button. Shared so a
 * failure looks the same everywhere, and so each editor offers the same Retry.
 */
export function AutosaveStatus({
  status,
  error,
  onRetry,
  className,
}: {
  status: AutosaveStatusValue;
  error: string | null;
  onRetry: () => void;
  className?: string;
}) {
  // Before the document loads there is no saved state to report yet.
  if (status === "idle") {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-w-0 items-center gap-1.5 whitespace-nowrap text-sm",
        className,
      )}
    >
      {status === "pending" && (
        <>
          <PencilLine className="size-4 shrink-0 text-amber-600" />
          <span className="text-amber-700">Unsaved changes</span>
        </>
      )}

      {status === "saving" && (
        <>
          <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="size-4 shrink-0 text-green-700" />
          <span className="text-green-700">All changes saved</span>
        </>
      )}

      {status === "error" && (
        <>
          <TriangleAlert className="size-4 shrink-0 text-destructive" />
          <span
            className="max-w-48 truncate font-medium text-destructive"
            title={error ?? undefined}
          >
            Save failed{error ? `: ${error}` : ""}
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-medium text-destructive underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
