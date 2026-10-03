"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { AppNotification } from "@/types/dashboard";

export default function NotificationFeed({
  notifications,
  markRead,
}: {
  notifications: AppNotification[];
  markRead: (id: string) => Promise<void>;
}) {
  const dismiss = async (id: string) => {
    try {
      await markRead(id);
    } catch {
      toast.error("Couldn't dismiss this notification. Please try again.");
    }
  };
  return (
    <div className="mb-6 flex flex-col gap-3" aria-label="Notifications">
      {notifications
        .filter((item) => item.type === "frq_graded" && item.readAt === null)
        .map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => void dismiss(item.id)}
            className="block rounded-lg border border-orange-200 bg-orange-50 p-4 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-gray-700">{item.body}</p>
          </Link>
        ))}
    </div>
  );
}
