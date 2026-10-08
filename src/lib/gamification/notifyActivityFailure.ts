import { toast } from "sonner";

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

/**
 * Runs `report`, and when it fails shows a pop-up with a Retry button that
 * runs it again. Retrying is safe: the /api/activity routes never count the
 * same activity twice, so a repeat after a request that did land is a no-op.
 */
export function reportWithRetry(
  report: () => Promise<unknown>,
  logLabel: string,
  id: string,
): void {
  // A double-click on Retry must not run two reports at once.
  if (inFlight.has(id)) return;
  inFlight.add(id);
  void (async () => {
    try {
      // Promise.resolve().then also catches a report that throws synchronously.
      await Promise.resolve().then(report);
    } catch (error) {
      console.error(logLabel, error);
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
        reportWithRetry(report, logLabel, id);
      });
      return;
    }
    inFlight.delete(id);
    toast.dismiss(id);
  })();
}
