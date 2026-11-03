"use client";

// https://github.com/vercel/next.js/discussions/42016

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/** Saves what is pending; resolves true when leaving would lose nothing. */
type LeaveHandler = () => Promise<boolean>;

// Firestore holds writes while offline instead of failing them, so a save made
// without a connection never settles. Without a cap, every link on the page
// would silently do nothing until the connection came back.
const LEAVE_SAVE_TIMEOUT_MS = 8000;

export const NavigationBlockerContext = createContext<
  [isBlocked: boolean, setBlocked: Dispatch<SetStateAction<boolean>>]
  /* eslint-disable-next-line */
>([false, () => {}]);

const LeaveHandlerContext = createContext<
  MutableRefObject<LeaveHandler | null>
>({ current: null });

export function NavigationBlockerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // [isBlocked, setBlocked]
  const state = useState(false);
  const leaveHandler = useRef<LeaveHandler | null>(null);
  return (
    <NavigationBlockerContext.Provider value={state}>
      <LeaveHandlerContext.Provider value={leaveHandler}>
        {children}
      </LeaveHandlerContext.Provider>
    </NavigationBlockerContext.Provider>
  );
}

export function useIsBlocked() {
  const [isBlocked] = useContext(NavigationBlockerContext);
  return isBlocked;
}

/**
 * `onLeave` lets an autosaving editor finish its save instead of asking the
 * author to throw the edit away: with a few seconds of debounce, "leave right
 * after typing" is the normal case, not the careless one.
 */
export function Blocker({ onLeave }: { onLeave?: LeaveHandler } = {}) {
  const [isBlocked, setBlocked] = useContext(NavigationBlockerContext);
  const leaveHandler = useContext(LeaveHandlerContext);
  useEffect(() => {
    setBlocked(() => {
      return true;
    });
    return () => {
      setBlocked(() => {
        return false;
      });
    };
  }, [isBlocked, setBlocked]);
  useEffect(() => {
    if (!onLeave) {
      return;
    }

    leaveHandler.current = onLeave;

    return () => {
      if (leaveHandler.current === onLeave) {
        leaveHandler.current = null;
      }
    };
  }, [leaveHandler, onLeave]);
  return null;
}

/**
 * Resolves true when an in-app navigation may go ahead: nothing is unsaved,
 * the pending changes saved, or the author chose to discard them.
 */
export function useConfirmLeave() {
  const isBlocked = useIsBlocked();
  const leaveHandler = useContext(LeaveHandlerContext);

  return useCallback(async () => {
    if (!isBlocked) {
      return true;
    }

    const handler = leaveHandler.current;

    if (handler) {
      const saved = await Promise.race([
        handler().catch(() => false),
        new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), LEAVE_SAVE_TIMEOUT_MS),
        ),
      ]);

      if (saved) {
        return true;
      }
    }

    return window.confirm(
      handler
        ? "Your latest changes have not been saved. Leave anyway and discard them?"
        : "Do you really want to leave and discard your unsaved changes?",
    );
  }, [isBlocked, leaveHandler]);
}

export function BlockBrowserNavigation() {
  const isBlocked = useIsBlocked();
  useEffect(() => {
    if (isBlocked) {
      const showModal = (event: BeforeUnloadEvent) => {
        event.preventDefault();
      };

      window.addEventListener("beforeunload", showModal);
      return () => {
        window.removeEventListener("beforeunload", showModal);
      };
    }
  }, [isBlocked]);

  return null;
}
