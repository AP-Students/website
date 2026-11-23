import { getAdminDb } from "@/lib/firebase-admin";
import {
  parseXpConfig,
  XP_CONFIG_COLLECTION,
  XP_CONFIG_DOC,
  type XpConfig,
} from "@/lib/gamification/xp";

/**
 * The XP amounts admins have saved, over the defaults. Read for every award
 * rather than cached, so a change in /admin/xp applies from the next one.
 */
export async function loadXpConfig(): Promise<XpConfig> {
  const snapshot = await getAdminDb()
    .collection(XP_CONFIG_COLLECTION)
    .doc(XP_CONFIG_DOC)
    .get();
  return parseXpConfig(snapshot.data());
}
