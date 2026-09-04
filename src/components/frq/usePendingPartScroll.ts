import { useEffect, useState } from "react";

/**
 * Scroll to a part once the question holding it has rendered. Shared by the
 * student test page and the grading page: both page by question and jump to
 * an individual part via a footer shortcut, so the part being scrolled to has
 * to exist in the DOM before `scrollIntoView` runs. Jumping to a part on
 * another question sets the question index and the pending part id together,
 * and React commits both before the effect below fires.
 *
 * `anchorId` converts a part id to the DOM id its page renders it under; the
 * two pages use different prefixes for that id, which is the only thing that
 * differs between them.
 */
export const usePendingPartScroll = (
  anchorId: (partId: string) => string,
  currentQuestionIndex: number,
) => {
  const [pendingScrollPartId, setPendingScrollPartId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!pendingScrollPartId) {
      return;
    }

    document
      .getElementById(anchorId(pendingScrollPartId))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    setPendingScrollPartId(null);
    // `anchorId` is a stable module-level function at every call site, so it
    // is intentionally left out of the dependency list rather than forcing
    // callers to memoize it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScrollPartId, currentQuestionIndex]);

  return setPendingScrollPartId;
};
