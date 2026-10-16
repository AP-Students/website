"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Subject } from "@/types/firestore";

export interface ClassProgress {
  done: number;
  total: number;
}

const testKey = (subject: string, unitId: string, testId: string) =>
  encodeURIComponent(JSON.stringify([subject, unitId, testId]));

async function publishedTestKeys(slug: string): Promise<Set<string>> {
  const subject = await getDoc(doc(db, "subjects", slug));
  const units = (subject.data() as Subject | undefined)?.units ?? [];
  const keys = new Set<string>();
  await Promise.all(
    units.map(async (unit) => {
      if (Array.isArray(unit.tests)) {
        for (const test of unit.tests) {
          if (test.isPublic === true) keys.add(testKey(slug, unit.id, test.id));
        }
      } else if (unit.test === true && unit.testId) {
        const test = await getDoc(
          doc(db, "subjects", slug, "units", unit.id, "tests", unit.testId),
        ).catch(() => null);
        if (test?.data()?.isPublic === true) {
          keys.add(testKey(slug, unit.id, unit.testId));
        }
      }
    }),
  );
  return keys;
}

export function useClassProgress(uid: string | undefined, slugs: string[]) {
  const [finished, setFinished] = useState<Record<string, Set<string>>>({});
  const [published, setPublished] = useState<Record<string, Set<string>>>({});
  const [completionError, setCompletionError] = useState(false);
  const [subjectError, setSubjectError] = useState(false);
  const slugList = slugs.join(",");

  useEffect(() => {
    setFinished({});
    setCompletionError(false);
    if (!uid) return;
    const list = slugList ? slugList.split(",") : [];
    const receipts: Record<string, string[]> = {};
    const legacyEvents: Record<string, string[]> = {};
    const publish = (slug: string) => {
      const fromReceipts = receipts[slug];
      const fromEvents = legacyEvents[slug];
      if (!fromReceipts || !fromEvents) return;
      setFinished((current) => ({
        ...current,
        [slug]: new Set([...fromReceipts, ...fromEvents]),
      }));
    };
    const onError = (loadError: Error) => {
      console.error("Unable to load completed tests", loadError);
      setCompletionError(true);
    };
    const unsubscribes = list.flatMap((slug) => [
      onSnapshot(
        query(
          collection(db, `users/${uid}/completedTests`),
          where("subject", "==", slug),
        ),
        (snapshot) => {
          receipts[slug] = snapshot.docs.map((item) => item.id);
          publish(slug);
        },
        onError,
      ),
      onSnapshot(
        query(
          collection(db, "activityEvents"),
          where("userId", "==", uid),
          where("type", "==", "mcq_test"),
          where("subject", "==", slug),
        ),
        (snapshot) => {
          legacyEvents[slug] = snapshot.docs.map((item) => {
            const data = item.data();
            return testKey(slug, String(data.unitId), String(data.sourceId));
          });
          publish(slug);
        },
        onError,
      ),
    ]);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [uid, slugList]);

  useEffect(() => {
    let cancelled = false;
    setSubjectError(false);
    const list = slugList ? slugList.split(",") : [];
    Promise.all(
      list.map(async (slug) => [slug, await publishedTestKeys(slug)] as const),
    )
      .then((entries) => {
        if (!cancelled) setPublished(Object.fromEntries(entries));
      })
      .catch((loadError: unknown) => {
        console.error("Unable to load class tests", loadError);
        if (!cancelled) setSubjectError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slugList]);

  const progress: Record<string, ClassProgress | undefined> = {};
  for (const [slug, keys] of Object.entries(published)) {
    const done = finished[slug];
    if (!done) continue;
    progress[slug] = {
      done: [...keys].filter((key) => done.has(key)).length,
      total: keys.size,
    };
  }
  return { progress, error: completionError || subjectError };
}
