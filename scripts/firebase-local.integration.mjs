import assert from "node:assert/strict";
import test from "node:test";
import { createUserWithEmailAndPassword, connectAuthEmulator, getAuth } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { connectStorageEmulator, deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { readFileSync } from "node:fs";
import { demoFirebaseConfig } from "../src/lib/firebase-mode.js";

test("local account, Firestore permissions and Storage fixtures", async (t) => {
  const { emulators: endpoints } = JSON.parse(readFileSync(new URL("../firebase.emulator.json", import.meta.url), "utf8"));
  const app = initializeApp(demoFirebaseConfig);
  t.after(() => deleteApp(app));
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  storage.maxUploadRetryTime = 5000;
  storage.maxOperationRetryTime = 5000;
  connectAuthEmulator(auth, `http://${endpoints.auth.host}:${endpoints.auth.port}`);
  connectFirestoreEmulator(db, endpoints.firestore.host, endpoints.firestore.port);
  connectStorageEmulator(storage, endpoints.storage.host, endpoints.storage.port);

  const body = new TextEncoder().encode("fixture");
  await uploadBytes(ref(storage, "feedbackImages/example.png"), body);
  await assert.rejects(uploadBytes(ref(storage, "unmatched/example"), body), {code: "storage/unauthorized"});
  const { user } = await createUserWithEmailAndPassword(auth, "owner@example.test", "Local-test-123");
  const account = doc(db, "users", user.uid);
  await setDoc(account, { uid: user.uid, access: "user" });
  await assert.rejects(updateDoc(account, {access: "admin"}), {code: "permission-denied"});
  const photo = ref(storage, `profilePictures/${user.uid}/example.png`);
  await uploadBytes(photo, body);
  const url = await getDownloadURL(photo);
  assert.equal(new URL(url).origin, `http://${endpoints.storage.host}:${endpoints.storage.port}`);
  assert.equal(await (await fetch(url)).text(), "fixture");
  for (const path of ["images/example.png", "image-png-123-example.png"]) {
    const asset = ref(storage, path);
    await uploadBytes(asset, body);
    await deleteObject(asset);
    await assert.rejects(getDownloadURL(asset), {code: "storage/object-not-found"});
  }
  await createUserWithEmailAndPassword(auth, "other@example.test", "Local-test-123");
  await assert.rejects(uploadBytes(photo, body), {code: "storage/unauthorized"});
});
