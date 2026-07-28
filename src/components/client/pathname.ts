"use client";

import { usePathname as useNextPathname } from "next/navigation";

export default function usePathname() {
  return useNextPathname();
}