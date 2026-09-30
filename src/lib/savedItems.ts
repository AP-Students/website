import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { SavedItem } from "@/types/dashboard";

/**
 * Saved readings/problems live in the user's `users/{uid}/savedItems`
 * subcollection, reusing the dashboard's `SavedItem` contract so the two
 * surfaces can't drift. `savedAt` is set server-side for a stable "newest
 * first" ordering.
 */

function savedItemRef(uid: string, id: string) {
  return doc(db, `users/${uid}/savedItems/${id}`);
}

export async function isSaved(uid: string, id: string): Promise<boolean> {
  return (await getDoc(savedItemRef(uid, id))).exists();
}

/**
 * Save a reading or problem. `id` is the Firestore document id; the stored
 * document is the dashboard `SavedItem` minus `id`/`savedAt`.
 */
export async function saveItem(
  uid: string,
  id: string,
  item: Omit<SavedItem, "id" | "savedAt">,
): Promise<void> {
  await setDoc(savedItemRef(uid, id), {
    ...item,
    savedAt: serverTimestamp(),
  });
}

export async function unsaveItem(uid: string, id: string): Promise<void> {
  await deleteDoc(savedItemRef(uid, id));
}

/** Newest first. The read back fills in the Firestore document id. */
export async function listSavedItems(uid: string): Promise<SavedItem[]> {
  const snap = await getDocs(
    query(
      collection(db, `users/${uid}/savedItems`),
      orderBy("savedAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({
    ...(d.data() as Omit<SavedItem, "id">),
    id: d.id,
  }));
}
