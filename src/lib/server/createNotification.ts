import {
  FieldValue,
  type DocumentReference,
  type Transaction,
} from "firebase-admin/firestore";
import type { AppNotification } from "../../types/dashboard.ts";

/** Caller checks its durable deduplication receipt in the same transaction. */
export function createNotification(
  transaction: Transaction,
  reference: DocumentReference,
  content: Pick<AppNotification, "type" | "title" | "body" | "href">,
) {
  transaction.create(reference, {
    id: reference.id,
    ...content,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
    // No production retention policy exists yet. Firestore TTL ignores null.
    expiresAt: null,
  });
}
