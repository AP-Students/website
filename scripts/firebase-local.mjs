import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { demoFirebaseConfig, demoProjectId } from "../src/lib/firebase-mode.js";

const require = createRequire(import.meta.url);
const [mode, ...args] = process.argv.slice(2);
if (mode === "dev") {
  // Next loads .env files after these process-level overrides.
  Object.assign(process.env, {
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
    NEXT_PUBLIC_FIREBASE_API_KEY: demoFirebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: demoFirebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: demoFirebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: demoFirebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: demoFirebaseConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: demoFirebaseConfig.appId,
  });
  const bin = require.resolve("next/dist/bin/next");
  process.argv = [process.execPath, bin, "dev", ...args];
  require(bin);
} else if (mode === "emulate" || mode === "test") {
  const localRequire = createRequire(new URL("../tools/firebase-emulator/package.json", import.meta.url));
  const bin = localRequire.resolve("firebase-tools/lib/bin/firebase.js");
  const data = "emulator";
  process.argv = [process.execPath, bin, "emulators:start", "--config",
    "firebase.emulator.json", "--project", demoProjectId, "--export-on-exit", data];
  if (mode === "test") {
    process.argv = [process.execPath, bin, "emulators:exec", "--config",
      "firebase.emulator.json", "--project", demoProjectId,
      "node --test scripts/firebase-local.integration.mjs"];
  } else if (existsSync(data)) process.argv.push("--import", data);
  require(bin);
} else {
  throw new Error("Expected dev, emulate or test");
}
