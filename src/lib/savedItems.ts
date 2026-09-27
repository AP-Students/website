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
import type { SavedItem } from "@/types/user";

export type SavedItemWithId = SavedItem & { id: string };

function savedItemRef(uid: string, id: string) {
  return doc(db, `users/${uid}/savedItems/${id}`);
}

export async function isSaved(uid: string, id: string): Promise<boolean> {
  return (await getDoc(savedItemRef(uid, id))).exists();
}

export async function saveItem(
  uid: string,
  id: string,
  item: Omit<SavedItem, "savedAt">,
): Promise<void> {
  await setDoc(savedItemRef(uid, id), {
    ...item,
    savedAt: serverTimestamp(),
  });
}

export async function unsaveItem(uid: string, id: string): Promise<void> {
  await deleteDoc(savedItemRef(uid, id));
}

/** Newest first. */
export async function listSavedItems(uid: string): Promise<SavedItemWithId[]> {
  const snap = await getDocs(
    query(
      collection(db, `users/${uid}/savedItems`),
      orderBy("savedAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ ...(d.data() as SavedItem), id: d.id }));
}
