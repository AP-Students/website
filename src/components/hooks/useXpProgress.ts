import { useLiveStats } from "@/components/hooks/useLiveStats";
import type { XpProgress } from "@/lib/gamification/xp";

export interface XpProgressState {
  /** Undefined while loading, and after a read error. */
  progress?: XpProgress;
  /**
   * Set when the stats couldn't be read. Kept separate so a failure is never
   * shown as a real "Level 1, 0 XP".
   */
  error?: Error;
}

/**
 * The signed-in student's XP total and level, kept live as the server awards
 * more. A student with no XP yet is level 1.
 */
export function useXpProgress(uid: string | undefined): XpProgressState {
  const { stats, error } = useLiveStats(uid);
  if (error) return { error };
  return { progress: stats?.xp };
}
