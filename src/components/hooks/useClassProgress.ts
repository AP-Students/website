"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
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
  const [completed, setCompleted] = useState<ReadonlySet<string> | null>(null);
  const [published, setPublished] = useState<Record<string, Set<string>>>({});
  const [error, setError] = useState(false);
  const slugList = slugs.join(",");

  useEffect(() => {
    setCompleted(null);
    setError(false);
    if (!uid) return;

    return onSnapshot(
      collection(db, `users/${uid}/completedTests`),
      (snapshot) => setCompleted(new Set(snapshot.docs.map((item) => item.id))),
      (loadError) => {
        console.error("Unable to load completed tests", loadError);
        setError(true);
      },
    );
  }, [uid]);

  useEffect(() => {
    let cancelled = false;
    const list = slugList ? slugList.split(",") : [];
    Promise.all(
      list.map(async (slug) => [slug, await publishedTestKeys(slug)] as const),
    )
      .then((entries) => {
        if (!cancelled) setPublished(Object.fromEntries(entries));
      })
      .catch((loadError: unknown) => {
        console.error("Unable to load class tests", loadError);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slugList]);

  const progress: Record<string, ClassProgress | undefined> = {};
  if (completed) {
    for (const [slug, keys] of Object.entries(published)) {
      progress[slug] = {
        done: [...keys].filter((key) => completed.has(key)).length,
        total: keys.size,
      };
    }
  }
  return { progress, error };
}
