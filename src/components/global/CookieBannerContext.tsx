"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface CookieBannerMetrics {
  visible: boolean;
  height: number;
}

interface CookieBannerContextValue extends CookieBannerMetrics {
  setMetrics: (metrics: CookieBannerMetrics) => void;
}

const CookieBannerContext = createContext<CookieBannerContextValue>({
  visible: false,
  height: 0,
  setMetrics: () => undefined,
});

export function CookieBannerProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<CookieBannerMetrics>({
    visible: false,
    height: 0,
  });

  return (
    <CookieBannerContext.Provider value={{ ...metrics, setMetrics }}>
      {children}
    </CookieBannerContext.Provider>
  );
}

export function useCookieBannerMetrics() {
  return useContext(CookieBannerContext);
}
