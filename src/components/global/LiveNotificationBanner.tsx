"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/components/hooks/UserContext";
import { useNotifications } from "@/components/hooks/useNotifications";
import type { AppNotification } from "@/types/dashboard";

/** Announce new grades anywhere on the site; existing unread grades stay in the dashboard. */
export default function LiveNotificationBanner() {
  const { user } = useUser();
  const uid = user?.uid;
  const { notifications, loaded, markRead } = useNotifications(uid);
  const seen = useRef<Set<string> | null>(null);
  const [banners, setBanners] = useState<AppNotification[]>([]);

  useEffect(() => {
    seen.current = null;
    setBanners([]);
  }, [uid]);

  useEffect(() => {
    if (!loaded || !uid) return;
    // The first loaded snapshot is history, not a new grading event.
    if (!seen.current) {
      seen.current = new Set(notifications.map((item) => item.id));
      return;
    }
    const added = notifications.filter(
      (item) =>
        !seen.current!.has(item.id) &&
        (item.type === "frq_graded" || item.type === "achievement") &&
        item.readAt === null,
    );
    notifications.forEach((item) => seen.current!.add(item.id));
    if (added.length) setBanners((current) => [...current, ...added]);
  }, [uid, loaded, notifications]);

  const open = (id: string) => {
    setBanners((current) => current.filter((item) => item.id !== id));
    void markRead(id).catch((error: unknown) =>
      console.error("Unable to acknowledge grade notification", error),
    );
  };

  if (!uid || !loaded || !banners.length) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col gap-2 p-3 sm:p-4"
    >
      {banners.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={() => open(item.id)}
          className="pointer-events-auto mx-auto block w-full max-w-2xl rounded-lg border border-orange-300 bg-orange-50 p-4 text-gray-900 shadow-lg duration-300 animate-in slide-in-from-top-8 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:animate-none"
        >
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm">{item.body}</p>
        </Link>
      ))}
    </div>
  );
}
