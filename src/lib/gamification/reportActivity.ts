import { auth } from "@/lib/firebase";
import { getDeviceTimeZone } from "@/lib/gamification/calendarDay";
import type { ActivityAwardResponse } from "@/types/dashboard";

/**
 * Posts a finished activity to one of the /api/activity routes. The server
 * checks the activity itself; the browser only adds its time zone so the day
 * is counted where the student is. Resolves to null for a signed-out visitor,
 * who has no streak to add to.
 */
async function reportActivity(
  path: string,
  body: Record<string, unknown>,
): Promise<ActivityAwardResponse | null> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return null;

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ ...body, timeZone: getDeviceTimeZone() }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(
      result.error ?? `Request failed with status ${response.status}`,
    );
  }
  return result as ActivityAwardResponse;
}

/** Counts a just-submitted FRQ toward the student's daily streak. */
export function reportFrqSubmission(
  submissionId: string,
): Promise<ActivityAwardResponse | null> {
  return reportActivity("/api/activity/frq", { submissionId });
}

/**
 * Counts a finished MCQ test toward the student's daily streak. The server
 * grades `answers` (selected option ids by question index) against the
 * published test rather than taking a score from the browser.
 */
export function reportMcqTest(test: {
  subject: string;
  unitId: string;
  testId: string;
  answers: Record<number, string[]>;
}): Promise<ActivityAwardResponse | null> {
  return reportActivity("/api/activity/mcq", test);
}
