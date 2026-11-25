// Lists chapters that students marked Reading, Practicing or Need Review
// before the dashboard existed, so they show under In Progress.
//
// The progress tracker saves a chapter's subject, unit, title and link with
// its progress, and the dashboard lists chapters from those. Chapters marked
// before that change have only `progress`, so they stay hidden until the
// student opens them again. This adds the same fields the tracker would.
// Progress and the reading-XP receipt are never touched.
//
// Dry run (prints what it would change):
//   node scripts/backfill-in-progress-readings.mjs
// Apply:
//   node scripts/backfill-in-progress-readings.mjs --write
//
// Credentials are the same as the app's: FIREBASE_ADMIN_PROJECT_ID,
// FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or Application
// Default Credentials. With FIRESTORE_EMULATOR_HOST set it uses the emulator
// (and GCLOUD_PROJECT as the project).

export const IN_PROGRESS = ["Reading", "Practicing", "Need Review"];

/**
 * The chapter slug in a link, as `formatSlug` in src/lib/utils.ts makes it.
 * @param {string} title
 */
export const formatSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z1-9 ]+/g, "")
    .replace(/\s/g, "-");

/**
 * @typedef {{ subject: string, unitId: string, label: string, href: string }} Listing
 */

/**
 * chapterId -> where the chapter lives, from each subject's unit list.
 * @param {Array<any[]>} subjects [slug, subject document data] pairs
 * @returns {Map<string, Listing>}
 */
export function chapterIndex(subjects) {
  /** @type {Map<string, Listing>} */
  const index = new Map();
  for (const [slug, subject] of subjects) {
    /** @type {any[]} */
    const units = Array.isArray(subject?.units) ? subject.units : [];
    units.forEach((unit, position) => {
      if (typeof unit?.id !== "string") return;
      const number = subject.hasUnit0 === true ? position : position + 1;
      for (const chapter of Array.isArray(unit.chapters) ? unit.chapters : []) {
        if (typeof chapter?.id !== "string" || index.has(chapter.id)) continue;
        const title =
          typeof chapter.title === "string" && chapter.title.trim()
            ? chapter.title
            : "Untitled";
        index.set(chapter.id, {
          subject: slug,
          unitId: `unit-${number}`,
          label: title.trim().slice(0, 200),
          href: `/subject/${slug}/unit-${number}-${unit.id}/chapter/${chapter.id}/${formatSlug(title)}`,
        });
      }
    });
  }
  return index;
}

/**
 * The listing to add to one chapterData document, or why it's skipped.
 * Returns null when the document needs nothing.
 * @param {Map<string, Listing>} index
 * @param {string} chapterId
 * @param {any} data the chapterData document
 * @returns {{ listing: Listing, skip?: undefined } | { skip: string, listing?: undefined } | null}
 */
export function listingFor(index, chapterId, data) {
  if (!IN_PROGRESS.includes(data?.progress)) return null;
  if (typeof data.href === "string" && data.href) return null;
  const listing = index.get(chapterId);
  return listing ? { listing } : { skip: "chapter not found in any subject" };
}

async function main() {
  const write = process.argv.includes("--write");
  const { initializeApp, cert, applicationDefault } = await import(
    "firebase-admin/app"
  );
  const { getFirestore, Timestamp } = await import("firebase-admin/firestore");

  const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const app = initializeApp(
    emulator
      ? { projectId }
      : {
          projectId,
          credential:
            projectId && clientEmail && privateKey
              ? cert({ projectId, clientEmail, privateKey })
              : applicationDefault(),
        },
  );
  const db = getFirestore(app);
  console.log(
    `${write ? "WRITING" : "Dry run"} against ${emulator ? `the emulator (${process.env.FIRESTORE_EMULATOR_HOST})` : "production"}, project ${projectId ?? "(default)"}`,
  );

  const subjects = (await db.collection("subjects").get()).docs.map((doc) => [
    doc.id,
    doc.data(),
  ]);
  const index = chapterIndex(subjects);
  console.log(`${subjects.length} subjects, ${index.size} chapters`);

  const users = await db.collection("users").listDocuments();
  const updates = [];
  const skipped = [];
  for (let i = 0; i < users.length; i += 25) {
    const chunk = users.slice(i, i + 25);
    const snapshots = await Promise.all(
      chunk.map((user) => user.collection("chapterData").get()),
    );
    for (const snapshot of snapshots) {
      for (const doc of snapshot.docs) {
        const result = listingFor(index, doc.id, doc.data());
        if (!result) continue;
        if (result.skip) skipped.push(`${doc.ref.path}: ${result.skip}`);
        else
          updates.push({
            ref: doc.ref,
            // Listed by when the student last changed it, like the tracker.
            fields: {
              ...result.listing,
              updatedAt: doc.updateTime ?? Timestamp.now(),
            },
          });
      }
    }
  }

  console.log(
    `${users.length} users; ${updates.length} chapters to list; ${skipped.length} skipped`,
  );
  for (const line of skipped.slice(0, 20)) console.log(`  skipped ${line}`);
  for (const { ref, fields } of updates.slice(0, 10))
    console.log(`  ${ref.path} -> ${fields.href}`);
  if (!write) {
    console.log("Dry run only. Run again with --write to apply.");
    return;
  }
  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch();
    for (const { ref, fields } of updates.slice(i, i + 400))
      batch.set(ref, fields, { merge: true });
    await batch.commit();
  }
  console.log(`Listed ${updates.length} chapters.`);
}

if (process.argv[1]?.endsWith("backfill-in-progress-readings.mjs")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
