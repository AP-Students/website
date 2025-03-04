"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/app/admin/subject/link";
import { ArrowLeft, Save, PlusCircle } from "lucide-react";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Blocker } from "@/app/admin/subject/navigation-block";
import apClassesData from "@/components/apClasses.json";
import { cn, formatSlug } from "@/lib/utils";
import short from "short-uuid";
import type { Subject, Unit } from "@/types/firestore";
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
        },
      ],
    },
  ],
};

export default function Page({ params }: { params: { slug: string } }) {
  const { user, error, setError, setLoading } = useUser();
  const [subjectTitle, setSubjectTitle] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);

  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  // For adding a new unit
  const [newUnitTitle, setNewUnitTitle] = useState<string>("");

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
    setUnits((prev) => [...prev, newUnit]);
    setNewUnitTitle("");
    setUnsavedChanges(true);
  };

  const handleDeleteUnit = (unitId: string) => {
    if (!confirm("Delete this unit?")) return;
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
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
    setUnits((prev) => prev.map((u) => (u.id === unitId ? updatedUnit : u)));
    setUnsavedChanges(true);
  };

  /****************************************************
   *                   SAVE ACTION
   * This function will force delete anything in the db that isnt in the local to keep db clean
   * If you dont want this, use the commented out handleSave.
   ****************************************************/

  // Replaces save
  const handleSave = async () => {
    // Rebuild the Subject object from current state
    const subjectToSave: Subject = {
      title: subjectTitle,
      units: units,
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
        existingChaptersSnap.forEach((chapterDoc) => {
          if (!localChapterIds.has(chapterDoc.id)) {
            batch.delete(chapterDoc.ref);
          }
        });

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
          existingTestsSnap.forEach((testDoc) => {
            if (!localTestIds.has(testDoc.id)) {
              batch.delete(testDoc.ref);
            }
          });

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
            <Button
              className={cn(
                "bg-blue-500 hover:bg-blue-600",
                unsavedChanges && "animate-pulse",
              )}
              onClick={handleSave}
            >
              <Save className="mr-2" /> Save Changes
            </Button>
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
              onChange={(e) => setNewUnitTitle(e.target.value)}
              placeholder="New unit title"
            />
            <Button
              onClick={handleAddUnit}
              className="cursor-pointer bg-green-500 hover:bg-green-600"
            >
              <PlusCircle className="mr-2" /> Add Unit
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
