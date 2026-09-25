/**
 * TEMPORARY: replace with phew's date function once it exists, so the
 * dashboard and the server always agree on what "today" is.
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Builds the cells for a Monday-first month calendar.
 * Returns empty slots (null) before the 1st, then one Date per day.
 * Example: September 2026 starts on a Tuesday, so it returns [null, Sep 1, Sep 2, ...].
 */
export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

/** Turns a "YYYY-MM-DD" key back into a local Date. */
export function parseDateKey(key: string): Date {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}



export function getStreakDayKeys(
  lastActiveDay: string | null,
  currentStreak: number,
): Set<string> {
  const keys = new Set<string>();
  if (!lastActiveDay) return keys;

  const last = parseDateKey(lastActiveDay);
  for (let i = 0; i < currentStreak; i++) {
    const day = new Date(last.getFullYear(), last.getMonth(), last.getDate() - i);
    keys.add(toDateKey(day));
  }
  return keys;
}

export function getDisplayStreak(currentStreak: number, lastActiveDay: string | null, today: Date): number {
  if (!lastActiveDay) return 0;

  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),);

  return lastActiveDay === todayKey || lastActiveDay === yesterdayKey ? currentStreak : 0;
}

//export function getDisplayStreak({currentStreak, lastActiveDay, today}: {currentStreak: number, lastActiveDay: string | null, today: Date}): number {


