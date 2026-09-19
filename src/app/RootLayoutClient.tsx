"use client";

import { UserProvider } from "@/components/hooks/UserContext";
import CookieBanner from "@/components/global/CookieBanner";
import React from "react";
import ReportErrorButton from "@/components/global/ReportErrorButton";
import { CookieBannerProvider } from "@/components/global/CookieBannerContext";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      {children}
      <CookieBannerProvider>
      <CookieBanner />
      <ReportErrorButton />
      </CookieBannerProvider>
    </UserProvider>
  );
}
