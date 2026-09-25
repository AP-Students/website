// DRAFT: field names must match what venkata/phew actually store in userStats/{uid}.
// Update this once they confirm.
export interface DashboardStats {
  totalXp: number;
  level: number;
  xpIntoLevel: number;      
  xpNeededForLevel: number; 
  problemsSolved: number;
  subjectsCompleted: number;
  currentStreak: number;
  lastActiveDay: string | null; 
}
