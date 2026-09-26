export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

export function intensityLevel(count: number): number {
  if (count >= 10) return 4;
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}


