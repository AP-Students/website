export const demoProjectId = "demo-aproject";
export const demoFirebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: demoProjectId + ".firebaseapp.com",
  projectId: demoProjectId,
  storageBucket: demoProjectId + ".appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:0000000000000000000000",
};

/** @template T @param {T} hosted @param {boolean} local */
export function firebaseConfigForMode(hosted, local) {
  return local ? { ...hosted, ...demoFirebaseConfig } : hosted;
}

/** @param {string | undefined} mode @param {string | undefined} flag */
export function usesFirebaseEmulators(mode, flag) {
  if (mode === "development" && flag !== undefined && flag !== "" && flag !== "true" && flag !== "false") {
    throw new Error("NEXT_PUBLIC_USE_FIREBASE_EMULATORS must be true or false");
  }
  return mode === "development" && flag === "true";
}

/** @param {string} projectId @param {boolean} local @param {{host: string, port: number}} endpoint */
export function firestoreDocumentsBase(projectId, local, endpoint) {
  const origin = local ? `http://${endpoint.host}:${endpoint.port}` : "https://firestore.googleapis.com";
  return `${origin}/v1/projects/${local ? demoProjectId : projectId}/databases/(default)/documents`;
}
