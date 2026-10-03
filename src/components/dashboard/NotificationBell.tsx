"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  PenLine,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification, NotificationType } from "@/types/dashboard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  level_up: TrendingUp,
  achievement: Award,
  frq_graded: PenLine,
};

export default function NotificationBell({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [readIds, setReadIds] = useState<Set<string>>(
    () =>
      new Set(notifications.filter((n) => n.readAt !== null).map((n) => n.id)),
  );
  const isUnread = (notification: AppNotification) =>
    notification.readAt === null && !readIds.has(notification.id);
  const unreadCount = notifications.filter(isUnread).length;
  const markRead = (id: string) => setReadIds((prev) => new Set(prev).add(id));
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-7 w-7" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-orange-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type];
              const unread = isUnread(notification);

              return (
                <li key={notification.id}>
                  <Link
                    href={notification.href}
                    onClick={() => markRead(notification.id)}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-orange-50 focus-visible:outline-none",
                      unread && "bg-orange-50/60",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 grow">
                      <span
                        className={cn(
                          "block text-sm",
                          unread
                            ? "font-semibold"
                            : "font-medium text-gray-700",
                        )}
                      >
                        {unread && <span className="sr-only">Unread: </span>}
                        {notification.title}
                      </span>
                      <span className="block text-xs text-gray-600">
                        {notification.body}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        {notification.createdAt
                          .toDate()
                          .toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                      </span>
                    </span>
                    {unread && (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
