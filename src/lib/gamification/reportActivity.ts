import { auth } from "@/lib/firebase";
import { getDeviceTimeZone } from "@/lib/gamification/calendarDay";
import type { ActivityAwardResponse } from "@/types/dashboard";

/**
 * Tells the server a student has just submitted an FRQ, so it counts toward
 * their daily streak. The server re-reads the submission itself; the browser
 * only adds its time zone so the day is counted where the student is.
 */
export async function reportFrqSubmission(
  submissionId: string,
): Promise<ActivityAwardResponse> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("You must be signed in to record study activity.");
  }

  const response = await fetch("/api/activity/frq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ submissionId, timeZone: getDeviceTimeZone() }),
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
