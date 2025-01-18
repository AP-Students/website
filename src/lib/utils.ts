import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/[^a-z1-9 ]+/g, "")
    .replace(/\s/g, "-");
}
