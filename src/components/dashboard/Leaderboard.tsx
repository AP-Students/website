"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEADERBOARD_SIZE } from "@/lib/leaderboard";
import { useLeaderboard } from "@/components/hooks/useLeaderboard";

export default function Leaderboard({
  uid,
  xp,
  xpFailed = false,
}: {
  uid: string;
  /** The viewer's XP, or undefined while it loads. */
  xp: number | undefined;
  /** Your XP couldn't be loaded, so your rank can't be worked out. */
  xpFailed?: boolean;
}) {
  const { entries, myRank, isPublic, updatedAt, error, loading, refresh } =
    useLeaderboard(uid, xp);
  const onBoard = entries?.some((entry) => entry.uid === uid) ?? false;

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="mx-auto flex w-full max-w-2xl flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="leaderboard-title" className="text-2xl font-bold">
          Leaderboard
        </h2>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          <RotateCw
            className={cn("h-4 w-4", loading && "animate-spin")}
            aria-hidden
          />
          Refresh
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Top {LEADERBOARD_SIZE} students by XP. Only public profiles are listed.
        {updatedAt && (
          <>
            {" "}
            Updated{" "}
            {updatedAt.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
            .
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
          {entries && updatedAt
            ? `Couldn't refresh the leaderboard, so this is from ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Try again in a moment.`
            : "Couldn't load the leaderboard. Try refreshing in a moment."}
        </p>
      )}
      {xpFailed && (
        <p role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
          Couldn&apos;t load your XP, so your rank isn&apos;t shown. Reload the
          page to try again.
        </p>
      )}
      {!entries && !error && (
        <p role="status" className="text-gray-500">
          Loading the leaderboard…
        </p>
      )}
      {entries?.length === 0 && (
        <p className="text-gray-500">
          No one has made their profile public yet.
        </p>
      )}

      {entries && entries.length > 0 && (
        <ol className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
          {entries.map((entry) => {
            const you = entry.uid === uid;
            return (
              <li
                key={entry.uid}
                aria-current={you ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  you && "bg-primary/10 font-semibold",
                )}
              >
                <span className="w-8 shrink-0 text-right tabular-nums text-gray-500">
                  {entry.rank}
                </span>
                {entry.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.photoURL}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gray-300" />
                )}
                <Link
                  href={`/profile/${entry.uid}`}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {entry.displayName}
                  {you && " (you)"}
                </Link>
                <span className="hidden shrink-0 text-sm text-gray-500 sm:inline">
                  Level {entry.level}
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums">
                  {entry.xp.toLocaleString()} XP
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {entries && myRank !== undefined && xp !== undefined && !onBoard && (
        <p className="rounded-md border border-gray-300 bg-white p-4">
          {isPublic ? (
            <>
              You&apos;re <strong>#{myRank}</strong> with {xp.toLocaleString()}{" "}
              XP.
            </>
          ) : (
            <>
              Your profile is private, so you&apos;re not on the leaderboard.
              With {xp.toLocaleString()} XP you&apos;d be{" "}
              <strong>#{myRank}</strong>.{" "}
              <a href="#profile" className="text-primary underline">
                Make your profile public
              </a>{" "}
              to show up.
            </>
          )}
        </p>
      )}
    </section>
  );
}
