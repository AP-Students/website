"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const arrowClass =
  "inline-flex size-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const list: (number | "gap")[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1]! > 1) list.push("gap");
    list.push(page);
  });
  return list;
}

export default function Pager({
  label,
  page,
  onPageChange,
  hasNext,
  totalPages,
  showNumbers = false,
  disabled = false,
}: {
  label: string;
  page: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  totalPages: number | null;
  showNumbers?: boolean;
  disabled?: boolean;
}) {
  const total = Math.max(totalPages ?? 0, hasNext ? page + 1 : page);
  if (total <= 1) return null;

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
        onClick={() => onPageChange(page - 1)}
        className={arrowClass}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>

      {showNumbers ? (
        <>
          <ol className="flex items-center gap-1">
            {pageList(page, total).map((item, index) =>
              item === "gap" ? (
                <li
                  key={`gap-${index}`}
                  aria-hidden="true"
                  className="px-1 text-gray-500"
                >
                  …
                </li>
              ) : (
                <li key={item}>
                  <button
                    type="button"
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    disabled={disabled}
                    onClick={() => onPageChange(item)}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-full font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                      item === page
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-orange-100",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ),
            )}
          </ol>
          <p className="sr-only" aria-live="polite">
            Page {page} of {total}
          </p>
        </>
      ) : (
        <p
          className="min-w-20 text-center font-semibold tabular-nums"
          aria-live="polite"
        >
          Page {page}
          {totalPages ? ` of ${totalPages}` : ""}
        </p>
      )}

      <button
        type="button"
        aria-label="Next page"
        title="Next page"
        disabled={disabled || !hasNext}
        onClick={() => onPageChange(page + 1)}
        className={arrowClass}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
