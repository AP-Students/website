"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const arrowClass =
  "inline-flex size-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export default function Pager({
  label,
  page,
  onPreviousPage,
  onNextPage,
  hasNext,
  totalPages,
  disabled = false,
}: {
  label: string;
  page: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  hasNext: boolean;
  totalPages: number | null;
  disabled?: boolean;
}) {
  if (page === 1 && !hasNext) return null;

  return (
    <nav
      aria-label={label}
      className="mt-4 flex items-center justify-center gap-2"
    >
      <button
        type="button"
        aria-label="Previous page"
        title="Previous page"
        disabled={disabled || page <= 1}
        onClick={onPreviousPage}
        className={arrowClass}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>

      <p
        className="min-w-20 text-center font-semibold tabular-nums"
        aria-live="polite"
      >
        Page {page}
        {totalPages ? ` of ${totalPages}` : ""}
      </p>

      <button
        type="button"
        aria-label="Next page"
        title="Next page"
        disabled={disabled || !hasNext}
        onClick={onNextPage}
        className={arrowClass}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
