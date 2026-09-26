
import type { UserStats } from "@/types/dashboard";

export type AchievementStats = Pick<
  UserStats,
  | "readingsCompleted"
  | "mcqTestsCompleted"
  | "frqsSubmitted"
  | "problemsSolved"
  | "subjectsCompleted"
  | "longestStreak"
  | "level"
>;



export type AchievementIcon = "book" | "test" | "frq" | "flame" | "star" | "target" | "trophy";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  stat: keyof AchievementStats;
  threshold: number;
  icon: AchievementIcon;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Reading
  { id: "reading-1", title: "First Page", description: "Complete your first chapter reading", stat: "readingsCompleted", threshold: 1, icon: "book" },
  { id: "reading-5", title: "Bookworm", description: "Complete 5 chapter readings", stat: "readingsCompleted", threshold: 5, icon: "book" },
  { id: "reading-25", title: "Scholar", description: "Complete 25 chapter readings", stat: "readingsCompleted", threshold: 25, icon: "book" },
  { id: "reading-50", title: "Librarian", description: "Complete 50 chapter readings", stat: "readingsCompleted", threshold: 50, icon: "book" },

  // Tests
  { id: "test-1", title: "Test Taker", description: "Finish your first practice test", stat: "mcqTestsCompleted", threshold: 1, icon: "test" },
  { id: "test-10", title: "Exam Ready", description: "Finish 10 practice tests", stat: "mcqTestsCompleted", threshold: 10, icon: "test" },

  // FRQs
  { id: "frq-1", title: "Free Thinker", description: "Submit your first FRQ", stat: "frqsSubmitted", threshold: 1, icon: "frq" },
  { id: "frq-10", title: "Essayist", description: "Submit 10 FRQs", stat: "frqsSubmitted", threshold: 10, icon: "frq" },

  // Streaks
  { id: "streak-3", title: "Warming Up", description: "Reach a 3-day streak", stat: "longestStreak", threshold: 3, icon: "flame" },
  { id: "streak-7", title: "On Fire", description: "Reach a 7-day streak", stat: "longestStreak", threshold: 7, icon: "flame" },
  { id: "streak-30", title: "Unstoppable", description: "Reach a 30-day streak", stat: "longestStreak", threshold: 30, icon: "flame" },

  // Levels
  { id: "level-5", title: "Rising Star", description: "Reach level 5", stat: "level", threshold: 5, icon: "star" },
  { id: "level-10", title: "Hive Mind", description: "Reach level 10", stat: "level", threshold: 10, icon: "star" },

  { id: "problems-100", title: "Problem Solver", description: "Solve 100 problems", stat: "problemsSolved", threshold: 100, icon: "target" },
  { id: "subject-1", title: "Course Complete", description: "Complete your first subject", stat: "subjectsCompleted", threshold: 1, icon: "trophy" },

];

