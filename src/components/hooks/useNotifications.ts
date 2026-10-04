"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  dashboardDocumentPaths,
  type AppNotification,
} from "@/types/dashboard";

export function useNotifications(uid: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState(false);
  const [loadedUid, setLoadedUid] = useState<string>();
  useEffect(() => {
    setNotifications([]);
    setError(false);
    setLoadedUid(undefined);
    if (!uid) return;
    return onSnapshot(
      query(
        collection(db, `notifications/${uid}/items`),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
      (snapshot) => {
        setNotifications(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }) as AppNotification)
            .filter(
              (item) =>
                !item.expiresAt || item.expiresAt.toMillis() > Date.now(),
            ),
        );
        setLoadedUid(uid);
      },
      (loadError) => {
        console.error("Unable to load notifications", loadError);
        setError(true);
      },
    );
  }, [uid]);

  const markRead = async (id: string) => {
    if (!uid) return;
    await updateDoc(doc(db, dashboardDocumentPaths.notification(uid, id)), {
      readAt: serverTimestamp(),
    });
  };
  return {
    notifications,
    error,
    loaded: Boolean(uid) && loadedUid === uid,
    markRead,
  };
}
