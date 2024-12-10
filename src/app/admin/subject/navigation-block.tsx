"use client";

// https://github.com/vercel/next.js/discussions/42016

import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export const NavigationBlockerContext = createContext<
  [isBlocked: boolean, setBlocked: Dispatch<SetStateAction<boolean>>]
  /* eslint-disable-next-line */
>([false, () => {}]);

export function NavigationBlockerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // [isBlocked, setBlocked]
  const state = useState(false);
  return (
    <NavigationBlockerContext.Provider value={state}>
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useIsBlocked() {
  const [isBlocked] = useContext(NavigationBlockerContext);
  return isBlocked;
}

export function Blocker() {
  const [isBlocked, setBlocked] = useContext(NavigationBlockerContext);
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
  return null;
}

export function BlockBrowserNavigation() {
  const isBlocked = useIsBlocked();
  useEffect(() => {
    // console.log({ isBlocked });
    if (isBlocked) {
      const showModal = (event: BeforeUnloadEvent) => {
        // console.log("showModal");
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
