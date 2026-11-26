/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");
import { readFileSync } from "node:fs";
import { demoFirebaseConfig, usesFirebaseEmulators } from "./src/lib/firebase-mode.js";

const localFirebase = usesFirebaseEmulators(process.env.NODE_ENV, process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS);

const { emulators } = JSON.parse(readFileSync(new URL("./firebase.emulator.json", import.meta.url), "utf8"));

/** @type {import("next").NextConfig} */
const config = {
  images: {
    ...(localFirebase ? { remotePatterns: [{
      protocol: "http", hostname: emulators.storage.host, port: String(emulators.storage.port),
      pathname: `/v0/b/${demoFirebaseConfig.storageBucket}/o/**`,
    }] } : {}),
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
  async redirects() {
    return [
      {
        source: "/lecture-feedback",
        destination: "https://forms.gle/utVZw3C6Jt9Mth8eA", // Replace with the actual Google Form/survey link
        permanent: false, // 'false' allows you to change the destination later without browser caching issues
      },
      // You can add more redirects like this:
      // {
      //   source: "/another-form",
      //   destination: "https://forms.gle/...",
      //   permanent: false,
      // },
    ];
  },
};

export default config;
