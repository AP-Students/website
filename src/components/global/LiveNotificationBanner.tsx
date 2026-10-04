"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useUser } from "@/components/hooks/UserContext";
import { useNotifications } from "@/components/hooks/useNotifications";
import type { AppNotification } from "@/types/dashboard";

const BANNER_DURATION_MS = 10_000;

function NotificationBanner({
  item,
  dismiss,
  open,
}: {
  item: AppNotification;
  dismiss: (id: string) => void;
  open: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), BANNER_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, dismiss]);

  return (
    <div className="pointer-events-auto relative mx-auto w-full max-w-2xl shrink-0 overflow-hidden rounded-lg border border-orange-300 bg-orange-50 text-gray-900 shadow-lg duration-300 animate-in slide-in-from-top-8 motion-reduce:animate-none">
      <Link
        href={item.href}
        onClick={() => open(item.id)}
        className="block break-words p-4 pr-14 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 text-sm leading-5">{item.body}</p>
      </Link>
      <button
        type="button"
        aria-label="Close notification"
        onClick={() => dismiss(item.id)}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-md text-orange-900 hover:bg-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X size={20} aria-hidden="true" />
      </button>
      <div aria-hidden="true" className="h-1 w-full bg-orange-100">
        <div
          className="countdown h-full w-full bg-orange-500"
          style={{ animationDuration: `${BANNER_DURATION_MS}ms` }}
        />
      </div>
      <style jsx>{`
        .countdown {
          transform-origin: right;
          animation-name: notification-countdown;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes notification-countdown {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}

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

  const dismiss = useCallback((id: string) => {
    setBanners((current) => current.filter((item) => item.id !== id));
  }, []);

  const open = (id: string) => {
    dismiss(id);
    void markRead(id).catch((error: unknown) =>
      console.error("Unable to acknowledge grade notification", error),
    );
  };

  if (!uid || !loaded || !banners.length) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex max-h-[100dvh] flex-col gap-2 overflow-y-auto p-3 sm:p-4"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      {banners.map((item) => (
        <NotificationBanner
          key={item.id}
          item={item}
          dismiss={dismiss}
          open={open}
        />
      ))}
    </div>
  );
}
