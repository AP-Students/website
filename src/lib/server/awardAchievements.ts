import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import {
  checkAchievements,
  readAchievementStats,
} from "../achievements/checkAchievements.ts";
import { dashboardDocumentPaths } from "../../types/dashboard.ts";
import { createNotification } from "./createNotification.ts";

/**
 * Call after all other transaction reads and before any writes, using the
 * activity's next trusted stats. The earned document is the durable receipt;
 * checking qualification alone never creates a notification.
 */
export async function awardAchievements(
  transaction: Transaction,
  db: Firestore,
  uid: string,
  nextStats: Record<string, unknown>,
): Promise<string[]> {
  const eligible = checkAchievements(
    readAchievementStats(nextStats),
    new Set(),
  );
  if (!eligible.length) return [];
  const refs = eligible.map((achievement) => ({
    earned: db.doc(`users/${uid}/achievements/${achievement.id}`),
    notification: db.doc(
      dashboardDocumentPaths.notification(uid, `achievement_${achievement.id}`),
    ),
  }));
  const snapshots = await transaction.getAll(
    ...refs.flatMap((ref) => [ref.earned, ref.notification]),
  );
  const unlocked: string[] = [];
  eligible.forEach((achievement, index) => {
    if (snapshots[index * 2]?.exists) return;
    const ref = refs[index]!;
    transaction.create(ref.earned, {
      id: achievement.id,
      title: achievement.title,
      earnedAt: FieldValue.serverTimestamp(),
    });
    if (!snapshots[index * 2 + 1]?.exists) {
      createNotification(transaction, ref.notification, {
        type: "achievement",
        title: achievement.title,
        body: `Achievement unlocked: ${achievement.description}.`,
        href: "/dashboard#achievements",
      });
    }
    unlocked.push(achievement.id);
  });
  return unlocked;
}
