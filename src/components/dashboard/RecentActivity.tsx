"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActivityEvent, GradeStatus } from "@/types/dashboard";
import { buttonVariants } from "@/components/ui/button";
import { findCourse } from "@/lib/dashboard/subjects";
import { cn } from "@/lib/utils";
import { useActivityPage } from "@/components/hooks/useActivityPage";
import Pager from "@/components/dashboard/Pager";

const FRQ_STATUS: Record<GradeStatus, string> = {
  none: "Submitted",
  pending: "Awaiting grade",
  graded: "Graded",
  self_graded: "Self-graded",
};

function unitLabel(unitId: string): string | null {
  const match = /^unit-(\d+)/.exec(unitId);
  return match ? `Unit ${match[1]}` : null;
}

function describe(event: ActivityEvent) {
  if (event.type === "mcq_test") {
    const missed = event.questions?.find((question) => !question.correct);
    if (missed) {
      return {
        item: `Q${missed.index}`,
        detail: missed.topic,
        action: "Go to Question",
      };
    }
    const score = event.score
      ? `${event.score.correct}/${event.score.total} correct`
      : "Test completed";
    return { item: event.label, detail: score, action: "View Test" };
  }
  if (event.type === "frq") {
    return {
      item: event.label,
      detail: FRQ_STATUS[event.gradeStatus],
      action: "View FRQ",
    };
  }
  return {
    item: event.label,
    detail: "Reading completed",
    action: "Open Reading",
  };
}

export default function RecentActivity({ uid }: { uid: string }) {
  const [page, setPage] = useState(1);
  const { events, hasNext, totalPages, loading, error } = useActivityPage(
    uid,
    page,
  );

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">Recent Activity:</h2>

      {error ? (
        <p role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
          Couldn&apos;t load your activity. Refresh to try again.
        </p>
      ) : loading && events.length === 0 ? (
        <p role="status" className="text-gray-500">
          Loading your activity…
        </p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">
          No activity yet. Finish a practice test or FRQ to see it here.
        </p>
      ) : (
        <>
          <ul
            aria-busy={loading}
            className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300 bg-white shadow"
          >
            {events.map((event) => {
              const { item, detail, action } = describe(event);
              const subjectName =
                findCourse(event.subject)?.name ?? event.subject;
              const title = [subjectName, unitLabel(event.unitId), item]
                .filter(Boolean)
                .join(" | ");

              return (
                <li key={event.id} className="p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-gray-600">{detail}</p>
                  <Link
                    href={event.href}
                    aria-label={`${action}: ${title}`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "mt-2 rounded-full",
                    )}
                  >
                    {action}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pager
            label="Recent activity pages"
            page={page}
            onPageChange={setPage}
            hasNext={hasNext}
            totalPages={totalPages}
            disabled={loading}
          />
        </>
      )}
    </section>
  );
}
