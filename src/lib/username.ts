export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

const RESERVED = new Set([
  "admin",
  "administrator",
  "fivehive",
  "grader",
  "help",
  "mod",
  "moderator",
  "null",
  "official",
  "root",
  "staff",
  "support",
  "system",
  "undefined",
]);

// Usernames are stored lowercase, so "Sam_Lee" and "sam_lee" are the same.
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

// What's wrong with a (normalized) username, or null if it's fine.
export function usernameProblem(username: string): string | null {
  if (username.length < USERNAME_MIN_LENGTH)
    return `Usernames need at least ${USERNAME_MIN_LENGTH} characters.`;
  if (username.length > USERNAME_MAX_LENGTH)
    return `Usernames can be at most ${USERNAME_MAX_LENGTH} characters.`;
  if (!/^[a-z0-9_]+$/.test(username))
    return "Use only letters, numbers and underscores.";
  if (!/^[a-z]/.test(username)) return "Start your username with a letter.";
  if (RESERVED.has(username)) return "That username isn't available.";
  return null;
}
