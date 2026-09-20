"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCookieBannerMetrics } from "./CookieBannerContext";

const COOKIE_CONSENT_KEY = "fivehive-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const { setMetrics } = useCookieBannerMetrics();

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent !== "accepted") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setMetrics({ visible: false, height: 0 });
      return;
    }
    const el = bannerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setMetrics({ visible: true, height: el.getBoundingClientRect().height });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [visible, setMetrics]);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      setVisible(false);
    } catch {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-primary-foreground/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies to provide and improve our services, and to comply with
          our Privacy Policy. By continuing, you accept our use of cookies.{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            Learn more
          </Link>
        </p>
        <Button onClick={accept} className="shrink-0">
          Accept cookies
        </Button>
      </div>
    </div>
  );
}
