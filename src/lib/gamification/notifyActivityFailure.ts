import { toast } from "sonner";
import { auth } from "@/lib/firebase";

/**
 * Shows a persistent pop-up with a Retry button. A stable `id` keeps repeat
 * failures of the same activity in one toast instead of stacking new ones.
 */
export function showXpRetryToast(
  id: string,
  retry: () => void,
  description = "Your work is saved. Try again to add the XP.",
  title = "Couldn't save your XP.",
): void {
  toast.error(title, {
    id,
    description,
    duration: Infinity,
    closeButton: true,
    action: { label: "Retry", onClick: retry },
  });
}

/**
 * A 4xx other than timeout, rate limit or an expired sign-in (401) fails the
 * same way on every retry.
 */
export function isPermanentFailure(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return (
    typeof status === "number" &&
    status >= 400 &&
    status < 500 &&
    status !== 401 &&
    status !== 408 &&
    status !== 429
  );
}

const inFlight = new Set<string>();
// Bumped by cancelXpReport so a report that was already running can tell its
// owner left, and stays quiet when it settles.
const generations = new Map<string, number>();

/** Stops showing results for `id`: dismisses its pop-up and mutes a running report. */
export function cancelXpReport(id: string): void {
  generations.set(id, (generations.get(id) ?? 0) + 1);
  inFlight.delete(id);
  toast.dismiss(id);
}

/**
 * Runs `report`, and when it fails shows a pop-up with a Retry button that
 * runs it again. Retrying is safe: the /api/activity routes never count the
 * same activity twice, so a repeat after a request that did land is a no-op.
 * `uid` is the student who earned the activity: if another account is signed
 * in by the time a report or retry runs, it is dropped instead of sent.
 */
export function reportWithRetry(
  report: () => Promise<unknown>,
  logLabel: string,
  id: string,
  uid: string,
): void {
  // A double-click on Retry must not run two reports at once.
  if (inFlight.has(id)) return;
  if (auth.currentUser?.uid !== uid) {
    toast.dismiss(id);
    return;
  }
  inFlight.add(id);
  const generation = generations.get(id) ?? 0;
  const isCancelled = () => (generations.get(id) ?? 0) !== generation;
  void (async () => {
    try {
      // Promise.resolve().then also catches a report that throws synchronously.
      await Promise.resolve().then(report);
    } catch (error) {
      console.error(logLabel, error);
      if (isCancelled()) return;
      inFlight.delete(id);
      if (isPermanentFailure(error)) {
        toast.error("Couldn't save your XP.", {
          id,
          description: error instanceof Error ? error.message : undefined,
          duration: 8000,
        });
        return;
      }
      showXpRetryToast(id, () => {
        toast.loading("Saving your XP…", { id });
        reportWithRetry(report, logLabel, id, uid);
      });
      return;
    }
    if (isCancelled()) return;
    inFlight.delete(id);
    toast.dismiss(id);
  })();
}
