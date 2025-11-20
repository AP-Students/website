"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/app/admin/subject/link";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  type DocumentData,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type QueryDocumentSnapshot,
  writeBatch,
} from "firebase/firestore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Blocker } from "@/app/admin/subject/navigation-block";
import apClassesData from "@/components/apClasses.json";
import { cn, formatSlug } from "@/lib/utils";
import short from "short-uuid";
import type { Subject, Unit, Chapter } from "@/types/firestore";
import UnitComponent from "./_components/unit";

const translator = short(short.constants.flickrBase58);

function generateShortId() {
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = translator.new().slice(0, 4);
  return timestamp + randomPart;
}

const apClasses = apClassesData.apClasses;

// Default empty subject structure
const emptyData: Subject = {
  title: "",
  units: [
    {
      id: generateShortId(),
      title: "Enter unit title...",
      chapters: [
        {
          id: generateShortId(),
          title: "Enter chapter title... (double click)",
        },
      ],
      tests: [],
    },
    {
      id: generateShortId(),
      title: "Subject Test",
      chapters: [],
      tests: [
        {
          id: generateShortId(),
          name: "Subject Test",
          questions: [],
          time: 0,
          directions:
            "Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).  All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
        },
      ],
    },
  ],
};

export default function Page({ params }: { params: { slug: string } }) {
  const { user, error, setError, setLoading } = useUser();
  const [subjectTitle, setSubjectTitle] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);

  const [subjectLoading, setSubjectLoading] = useState<boolean>(true);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  // For adding a new unit
  const [newUnitTitle, setNewUnitTitle] = useState<string>("");

  // Cross-port state (copy chapter/article from another subject)
  const [crossportSource, setCrossportSource] = useState<string>("");
  const [crossportUnits, setCrossportUnits] = useState<Unit[]>([]);
  const [crossportUnitId, setCrossportUnitId] = useState<string>("");
  const [crossportChapters, setCrossportChapters] = useState<Chapter[]>([]);
  const [crossportChapterId, setCrossportChapterId] = useState<string>("");
  const [targetUnitId, setTargetUnitId] = useState<string>("");
  const [newTargetUnitTitle, setNewTargetUnitTitle] = useState<string>("");
  const [targetChapterTitle, setTargetChapterTitle] = useState<string>("");
  const [isLoadingSource, setIsLoadingSource] = useState<boolean>(false);
  const [isCrossporting, setIsCrossporting] = useState<boolean>(false);
  const [crossportStatus, setCrossportStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (user && (user.access === "admin" || user.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // We have an existing subject
            const fetched = docSnap.data() as Subject;
            setSubjectTitle(fetched.title);
            setUnits(fetched.units || []);
          } else {
            // Subject not found -> create new with default template
            // Also try to fill in subject title from `apClasses` if found
            const foundTitle =
              apClasses.find(
                (apClass) =>
                  formatSlug(apClass.replace(/AP /g, "")) === params.slug,
              ) ?? "";
            const newSubject = structuredClone(emptyData);
            newSubject.title = foundTitle;
            setSubjectTitle(newSubject.title);
            setUnits(newSubject.units);
          }
          setSubjectLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    })().catch((err) => {
      console.error("Error fetching subject:", err);
    });
  }, [user, params.slug, setError, setLoading]);

  /****************************************************
   *                   UNIT ACTIONS
   ****************************************************/

  const handleAddUnit = () => {
    if (!newUnitTitle.trim()) return;
    const newUnit: Unit = {
      id: generateShortId(),
      title: newUnitTitle,
      chapters: [
        {
          id: generateShortId(),
          title: "Enter a chapter title...",
        },
      ],
      tests: [],
    };
    setUnits((prev: Unit[]) => [...prev, newUnit]);
    setNewUnitTitle("");
    setUnsavedChanges(true);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (!confirm("Delete this unit?")) return;
    setUnits((prev: Unit[]) => prev.filter((u: Unit) => u.id !== unitId));
    setUnsavedChanges(true);
  };

  const handleMoveUnitUp = (index: number) => {
    if (index === 0) return;
    const updatedUnits = [...units];
    const temp = updatedUnits[index];
    updatedUnits[index] = updatedUnits[index - 1]!;
    updatedUnits[index - 1] = temp!;
    setUnits(updatedUnits);
    setUnsavedChanges(true);
  };

  const handleMoveUnitDown = (index: number) => {
    if (index === units.length - 1) return;
    const updatedUnits = [...units];
    const temp = updatedUnits[index];
    updatedUnits[index] = updatedUnits[index + 1]!;
    updatedUnits[index + 1] = temp!;
    setUnits(updatedUnits);
    setUnsavedChanges(true);
  };

  // Called by each <UnitComponent> whenever that unit updates
  const handleUnitChange = (unitId: string, updatedUnit: Unit) => {
    setUnits((prev: Unit[]) =>
      prev.map((u: Unit) => (u.id === unitId ? updatedUnit : u)),
    );
    setUnsavedChanges(true);
  };

  /****************************************************
   *                   SAVE ACTION
   * This function will force delete anything in the db that isnt in the local to keep db clean
   * If you dont want this, use the commented out handleSave.
   ****************************************************/

  // Replaces save
  const handleSave = async (overrideUnits?: Unit[]) => {
    // Rebuild the Subject object from current state
    const subjectToSave: Subject = {
      title: subjectTitle,
      units: overrideUnits ?? units,
    };

    try {
      const batch = writeBatch(db);

      // 1. Save the main subject doc
      batch.set(doc(db, "subjects", params.slug), subjectToSave);

      // 2. For each Unit, update or create the unit doc, then manage sub-collections
      for (const unit of subjectToSave.units) {
        // Set (upsert) the Unit itself
        batch.set(doc(db, "subjects", params.slug, "units", unit.id), unit);

        // ----- Chapters -----
        const chapterCollectionRef = collection(
          db,
          "subjects",
          params.slug,
          "units",
          unit.id,
          "chapters",
        );

        // a) Fetch all existing chapters in Firestore
        const existingChaptersSnap = await getDocs(chapterCollectionRef);

        // b) Build a set of local chapter IDs so we know what should exist
        const localChapterIds = new Set(unit.chapters.map((c) => c.id));

        // c) For each chapter in Firestore, if it's NOT in our local data, delete it
        existingChaptersSnap.forEach(
          (chapterDoc: QueryDocumentSnapshot<DocumentData>) => {
            if (!localChapterIds.has(chapterDoc.id)) {
              batch.delete(chapterDoc.ref);
            }
          },
        );

        // d) Now, upsert all chapters from our local data
        for (const chapter of unit.chapters) {
          const chapterDocRef = doc(chapterCollectionRef, chapter.id);
          batch.set(chapterDocRef, chapter, { merge: true });
        }

        // ----- Tests -----
        if (unit.tests) {
          const testsCollectionRef = collection(
            db,
            "subjects",
            params.slug,
            "units",
            unit.id,
            "tests",
          );

          // a) Fetch all existing tests in Firestore
          const existingTestsSnap = await getDocs(testsCollectionRef);

          // b) Build a set of local test IDs
          const localTestIds = new Set(unit.tests.map((t) => t.id));

          // c) Delete any Firestore test that is no longer in our local data
          existingTestsSnap.forEach(
            (testDoc: QueryDocumentSnapshot<DocumentData>) => {
              if (!localTestIds.has(testDoc.id)) {
                batch.delete(testDoc.ref);
              }
            },
          );

          // d) Upsert all tests from our local data
          for (const test of unit.tests) {
            const testDocRef = doc(testsCollectionRef, test.id);
            batch.set(
              testDocRef,
              { name: test.name, isPublic: test.isPublic ?? false },
              { merge: true },
            );
          }
        }

        // If you still have single-test logic (unit.test / unit.testId),
        // you'd have to decide how to handle that (like the multi-test approach).
      }

      // 3. Commit the batch
      await batch.commit();
      alert("Subject content saved successfully.");
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving subject. Check console for details.");
    }
  };

  /****************************************************
   *                 CROSS-PORT ACTION
   * Copy a chapter/article from another subject/unit.
   ****************************************************/

  // Load source subject units/chapters when the source changes
  useEffect(() => {
    if (!crossportSource) {
      setCrossportUnits([]);
      setCrossportUnitId("");
      setCrossportChapters([]);
      setCrossportChapterId("");
      return;
    }

    setIsLoadingSource(true);
    setCrossportStatus(null);

    (async () => {
      const sourceDocRef = doc(db, "subjects", crossportSource);
      const sourceDocSnap = await getDoc(sourceDocRef);

      if (!sourceDocSnap.exists()) {
        setCrossportUnits([]);
        setCrossportUnitId("");
        setCrossportChapters([]);
        setCrossportChapterId("");
        setCrossportStatus("Source subject not found in Firestore.");
        return;
      }

      const data = sourceDocSnap.data() as Subject;
      setCrossportUnits(data.units ?? []);
      setCrossportUnitId("");
      setCrossportChapters([]);
      setCrossportChapterId("");
    })()
      .catch((err) =>
        setCrossportStatus(
          `Failed to load source subject: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      )
      .finally(() => setIsLoadingSource(false));
  }, [crossportSource]);

  // When a source unit is chosen, refresh the list of source chapters
  useEffect(() => {
    const selectedUnit = crossportUnits.find(
      (u: Unit) => u.id === crossportUnitId,
    );
    setCrossportChapters(selectedUnit?.chapters ?? []);
    setCrossportChapterId("");
  }, [crossportUnitId, crossportUnits]);

  // Auto-fill the target chapter title with the selected source chapter title
  useEffect(() => {
    const selectedChapter = crossportChapters.find(
      (ch) => ch.id === crossportChapterId,
    );
    if (selectedChapter) {
      setTargetChapterTitle(selectedChapter.title ?? "");
    }
  }, [crossportChapterId, crossportChapters]);

  const handleCrossport = async () => {
    setCrossportStatus(null);

    if (!crossportSource || !crossportUnitId || !crossportChapterId) {
      setCrossportStatus(
        "Select a source subject, unit, and article to cross-port.",
      );
      return;
    }

    // Determine target unit for the incoming chapter
    const usingNewUnit = targetUnitId === "__new__";
    const resolvedTargetUnitId = usingNewUnit
      ? generateShortId()
      : targetUnitId || units.at(0)?.id || "";

    if (!resolvedTargetUnitId) {
      setCrossportStatus("Choose a target unit to receive the article.");
      return;
    }

    if (usingNewUnit && !newTargetUnitTitle.trim()) {
      setCrossportStatus("Enter a title for the new target unit.");
      return;
    }

    const selectedSourceChapter =
      crossportChapters.find((ch) => ch.id === crossportChapterId) ?? null;
    const chapterTitle =
      targetChapterTitle.trim() ||
      selectedSourceChapter?.title ||
      "Imported Article";

    setIsCrossporting(true);
    try {
      // Pull the source chapter content
      const sourceChapterRef = doc(
        db,
        "subjects",
        crossportSource,
        "units",
        crossportUnitId,
        "chapters",
        crossportChapterId,
      );
      const sourceChapterSnap = await getDoc(sourceChapterRef);
      if (!sourceChapterSnap.exists()) {
        throw new Error("Source article not found at the chosen path.");
      }

      // Clone current units so we can append the imported chapter
      const clonedUnits: Unit[] = JSON.parse(
        JSON.stringify(units ?? []),
      ) as Unit[];
      let nextUnits = clonedUnits;

      if (usingNewUnit) {
        nextUnits = [
          ...nextUnits,
          {
            id: resolvedTargetUnitId,
            title: newTargetUnitTitle.trim(),
            chapters: [],
            tests: [],
          },
        ];
      }

      const newChapterId = generateShortId();
      nextUnits = nextUnits.map((unit: Unit) =>
        unit.id === resolvedTargetUnitId
          ? {
              ...unit,
              chapters: [
                ...(unit.chapters ?? []),
                { id: newChapterId, title: chapterTitle },
              ],
            }
          : unit,
      );

      // Write the cloned content into the target location
      const targetChapterRef = doc(
        db,
        "subjects",
        params.slug,
        "units",
        resolvedTargetUnitId,
        "chapters",
        newChapterId,
      );
      const sourceData = sourceChapterSnap.data();
      await setDoc(targetChapterRef, {
        ...sourceData,
        id: newChapterId,
        title: chapterTitle,
        copiedFrom: {
          subject: crossportSource,
          unitId: crossportUnitId,
          chapterId: crossportChapterId,
          at: new Date().toISOString(),
        },
      });

      // Sync UI and flag unsaved changes so the user can commit unit metadata
      setUnits(nextUnits);
      setTargetUnitId(resolvedTargetUnitId);
      setUnsavedChanges(true);
      setCrossportStatus(
        `Copied "${chapterTitle}". Click "Save Changes" to persist the updated unit list.`,
      );
    } catch (err) {
      setCrossportStatus(
        `Cross-port failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      setIsCrossporting(false);
    }
  };

  // Adds save
  // const handleSave = async () => {
  //   // Rebuild the Subject object from current state
  //   const subjectToSave: Subject = {
  //     title: subjectTitle,
  //     units: units,
  //   };

  //   try {
  //     const batch = writeBatch(db);

  //     // Save the main subject doc
  //     batch.set(doc(db, "subjects", params.slug), subjectToSave);

  //     // Save each unit, chapter, test as subcollections
  //     subjectToSave.units.forEach((unit) => {
  //       batch.set(doc(db, "subjects", params.slug, "units", unit.id), unit);

  //       // chapters
  //       unit.chapters.forEach((chapter) => {
  //         const chapterDocRef = doc(
  //           db,
  //           "subjects",
  //           params.slug,
  //           "units",
  //           unit.id,
  //           "chapters",
  //           chapter.id
  //         );
  //         batch.set(chapterDocRef, chapter, { merge: true });
  //       });

  //       // tests
  //       unit.tests?.forEach((test) => {
  //         const testDocRef = doc(
  //           db,
  //           "subjects",
  //           params.slug,
  //           "units",
  //           unit.id,
  //           "tests",
  //           test.id
  //         );
  //         batch.set(testDocRef, test, { merge: true });
  //       });
  //     });

  //     await batch.commit();
  //     alert("Subject content saved successfully.");
  //     setUnsavedChanges(false);
  //   } catch (error) {
  //     console.error("Error saving:", error);
  //     alert("Error saving subject. Check console for details.");
  //   }
  // };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error ?? "Loading..."}
      </div>
    );
  }

  return (
    <>
      {/* If unsaved changes exist, use the <Blocker /> to warn on navigation */}
      {unsavedChanges && <Blocker />}

      <div className="relative min-h-screen">
        <main
          className={cn(
            "container max-w-3xl flex-grow px-4 pb-8 pt-10 md:px-10 lg:px-14 2xl:px-20",
            unsavedChanges && "ring-8 ring-red-500",
          )}
        >
          <div className="flex justify-between">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin"
            >
              <ArrowLeft className="mr-2" />
              Return to Admin Dashboard
            </Link>
            {(!subjectLoading || unsavedChanges) && (
              <Button
                className={cn(
                  "bg-blue-500 hover:bg-blue-600",
                  unsavedChanges && "animate-pulse",
                )}
                onClick={() => handleSave()}
              >
                <Save className="mr-2" /> Save Changes
              </Button>
            )}
          </div>

          {/* Subject Title */}
          <h1 className="mt-8 text-4xl font-bold">
            {subjectTitle || "Untitled Subject"}
          </h1>

          {/* Render each Unit */}
          <div className="my-4 space-y-4">
            {units.map((unit, index) => (
              <UnitComponent
                key={unit.id}
                unit={unit}
                index={index}
                subjectTitle={subjectTitle}
                onChange={handleUnitChange}
                onDelete={handleDeleteUnit}
                onMoveUp={handleMoveUnitUp}
                onMoveDown={handleMoveUnitDown}
                subjectSlug={params.slug}
              />
            ))}
          </div>

          {/* Add new Unit */}
          <div className="mb-4 flex items-center">
            <Input
              className="mr-2 rounded"
              value={newUnitTitle}
              onChange={(e: any) => setNewUnitTitle(e.target.value)}
              placeholder="New unit title"
            />
            <Button
              onClick={handleAddUnit}
              className="bg-green-500 hover:bg-green-600"
              disabled={!newUnitTitle.trim()}
            >
              <Plus className="-ml-1 mr-2" /> Add Unit
            </Button>
          </div>

          {/* Cross-port (import) an article from another subject */}
          <div className="mt-8 space-y-3 rounded-lg border border-dashed border-blue-300 p-4">
            <h2 className="text-2xl font-semibold">Cross-Port Article</h2>
            <p className="text-sm text-muted-foreground">
              Copy a chapter/article from any subject (e.g., AP Calculus AB &lt;-&gt; AP Calculus BC) into this subject.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source subject</label>
                <select
                  className="w-full rounded border p-2"
                  value={crossportSource}
                  onChange={(e: any) => setCrossportSource(e.target.value)}
                >
                  <option value="">Select a subject...</option>
                  {apClasses.map((apClass) => {
                    const slug = formatSlug(apClass.replace(/AP /g, ""));
                    return (
                      <option key={slug} value={slug}>
                        {apClass}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source unit</label>
                <select
                  className="w-full rounded border p-2"
                  value={crossportUnitId}
                  onChange={(e: any) => setCrossportUnitId(e.target.value)}
                  disabled={isLoadingSource || !crossportUnits.length}
                >
                  <option value="">Select a unit...</option>
                  {crossportUnits.map((unit: Unit, idx: number) => (
                    <option key={unit.id} value={unit.id}>
                      {idx + 1}. {unit.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source article</label>
                <select
                  className="w-full rounded border p-2"
                  value={crossportChapterId}
                  onChange={(e: any) => setCrossportChapterId(e.target.value)}
                  disabled={!crossportChapters.length}
                >
                  <option value="">Select an article...</option>
                  {crossportChapters.map((chapter: Chapter, idx: number) => (
                    <option key={chapter.id} value={chapter.id}>
                      {idx + 1}. {chapter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target unit (this subject)</label>
                <select
                  className="w-full rounded border p-2"
                  value={targetUnitId}
                  onChange={(e: any) => setTargetUnitId(e.target.value)}
                >
                  <option value="">Select an existing unit...</option>
                  {units.map((unit: Unit, idx: number) => (
                    <option key={unit.id} value={unit.id}>
                      {idx + 1}. {unit.title}
                    </option>
                  ))}
                  <option value="__new__">+ Create new unit</option>
                </select>
              </div>

              {targetUnitId === "__new__" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">New unit title</label>
                  <Input
                    value={newTargetUnitTitle}
                    onChange={(e: any) => setNewTargetUnitTitle(e.target.value)}
                    placeholder="e.g., Limits and Continuity"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Target article title (optional override)
                </label>
                <Input
                  value={targetChapterTitle}
                  onChange={(e: any) => setTargetChapterTitle(e.target.value)}
                  placeholder="Defaults to the source article title"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleCrossport}
                disabled={isCrossporting}
              >
                {isCrossporting ? "Copying..." : "Cross-Port Article"}
              </Button>
              {crossportStatus && (
                <p className="text-sm text-muted-foreground">{crossportStatus}</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
