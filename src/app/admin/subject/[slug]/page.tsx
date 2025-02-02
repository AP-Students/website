"use client";
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash,
  PlusCircle,
  ArrowLeft,
  Save,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { Link } from "@/app/admin/subject/link";
import apClassesData from "@/components/apClasses.json";
import type { Subject } from "@/types/firestore";
import usePathname from "@/components/client/pathname";
import { Blocker } from "@/app/admin/subject/navigation-block";
import { formatSlug } from "@/lib/utils";
import short from "short-uuid";

const translator = short(short.constants.flickrBase58);

function generateShortId() {
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = translator.new().slice(0, 4);
  return timestamp + randomPart;
}

const apClasses = apClassesData.apClasses;

// Empty subject template
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
      test: false,
    },
    {
      id: generateShortId(),
      title: "Subject Test",
      chapters: [],
      test: true,
      testId: generateShortId(),
    },
  ],
};

const Page = ({ params }: { params: { slug: string } }) => {
  const pathname = usePathname();
  const { user, error, setError, setLoading } = useUser();
  const [subject, setSubject] = useState<Subject>();
  const [expandedUnits, setExpandedUnits] = useState<number[]>([]);

  const [editingUnit, setEditingUnit] = useState<{
    unitIndex: number | null;
  }>({ unitIndex: null });

  const [editingChapter, setEditingChapter] = useState<{
    unitIndex: number | null;
    chapterIndex: number | null;
  }>({ unitIndex: null, chapterIndex: null });

  const [newUnitTitle, setNewUnitTitle] = useState("");

  // Initialize newChapterTitles as an empty array
  const [newChapterTitles, setNewChapterTitles] = useState<string[]>([]);

  const unitTitleInputRef = useRef<HTMLInputElement | null>(null);
  const chapterInputRef = useRef<HTMLInputElement | null>(null);

  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  useEffect(() => {
    // Fetch subject data
    (async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSubject(docSnap.data() as Subject);
            // Initialize newChapterTitles with empty strings for each unit
            const unitsLength = (docSnap.data() as Subject).units.length;
            setNewChapterTitles(Array(unitsLength).fill(""));
          } else {
            setSubject({
              ...structuredClone(emptyData),
              title:
                apClasses.find(
                  (apClass) =>
                    formatSlug(apClass.replace(/AP /g, "")) === params.slug,
                ) ?? "",
            });
            // Initialize newChapterTitles with empty strings for each unit in emptyData
            const unitsLength = emptyData.units.length;
            setNewChapterTitles(Array(unitsLength).fill(""));
          }
        }
      } catch (error) {
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    })().catch((error) => {
      console.error("Error fetching subject:", error);
    });
  }, [user, params.slug, setError, setLoading]);

  const moveUnitDown = (unitIndex: number) => {
    if (!subject || unitIndex === subject.units.length - 1) return;
    const updatedUnits = [...subject.units];
    const temp = updatedUnits[unitIndex]!;
    updatedUnits[unitIndex] = updatedUnits[unitIndex + 1]!;
    updatedUnits[unitIndex + 1] = temp;
    setSubject({ ...subject, units: updatedUnits });
    setUnsavedChanges(true);
  };

  const moveUnitUp = (unitIndex: number) => {
    if (!subject || unitIndex === 0) return;
    const updatedUnits = [...subject.units];
    const temp = updatedUnits[unitIndex]!;
    updatedUnits[unitIndex] = updatedUnits[unitIndex - 1]!;
    updatedUnits[unitIndex - 1] = temp;
    setSubject({ ...subject, units: updatedUnits });
    setUnsavedChanges(true);
  };

  const addUnit = () => {
    if (!newUnitTitle.trim() || !subject) return;
    const newUnit = {
      id: generateShortId(),
      title: newUnitTitle,
      chapters: [
        {
          id: generateShortId(),
          title: "Enter a chapter title...",
        },
      ],
      test: false,
    };
    setSubject({ ...subject, units: [...subject.units, newUnit] });
    setNewUnitTitle("");
    // Add a new entry for the new unit in newChapterTitles
    setNewChapterTitles((prev) => [...prev, ""]);
    setUnsavedChanges(true);
  };

  const deleteUnit = (unitIndex: number) => {
    if (!subject) return;
    const updatedUnits = [...subject.units];
    updatedUnits.splice(unitIndex, 1);
    setSubject({ ...subject, units: updatedUnits });
    // Remove the corresponding chapter title entry
    setNewChapterTitles((prev) =>
      prev.filter((_, index) => index !== unitIndex),
    );
    setUnsavedChanges(true);
  };

  const addChapter = (unitIndex: number) => {
    if (!newChapterTitles[unitIndex]?.trim() || !subject) return;
    const updatedUnits = [...subject.units];
    updatedUnits[unitIndex]!.chapters.push({
      id: generateShortId(),
      title: newChapterTitles[unitIndex],
    });
    setSubject({ ...subject, units: updatedUnits });
    // Reset the newChapterTitle for this unit
    setNewChapterTitles((prev) =>
      prev.map((title, index) => (index === unitIndex ? "" : title)),
    );
    setUnsavedChanges(true);
  };

  const editUnitTitle = (unitIndex: number, newTitle: string) => {
    if (!subject) return;
    if (newTitle.trim().length === 0) {
      alert("Title cannot be empty.");
      return;
    } else {
      const updatedUnits = [...subject.units];
      updatedUnits[unitIndex]!.title = newTitle;
      setSubject({ ...subject, units: updatedUnits });
      setEditingUnit({ unitIndex: null });
      setUnsavedChanges(true);
    }
  };

  const editChapterTitle = (
    unitIndex: number,
    chapterIndex: number,
    newTitle: string,
  ) => {
    if (!subject) return;
    if (newTitle.trim().length === 0) {
      alert("Title cannot be empty.");
      return;
    } else {
      const updatedUnits = [...subject.units];
      updatedUnits[unitIndex]!.chapters[chapterIndex]!.title = newTitle;
      setSubject({ ...subject, units: updatedUnits });
      setEditingChapter({ unitIndex: null, chapterIndex: null });
      setUnsavedChanges(true);
    }
  };

  const deleteChapter = (unitIndex: number, chapterIndex: number) => {
    if (!subject) return;
    const updatedUnits = [...subject.units];
    updatedUnits[unitIndex]!.chapters.splice(chapterIndex, 1);
    setSubject({ ...subject, units: updatedUnits });
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "subjects", params.slug), subject);
      subject?.units.forEach((unit) => {
        // Typescript complains that unit.id and chapter.id are of any type, but eslint complains of unnessecary type assertions.
        // if typeof guard doesn't seem to work
        /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
        batch.set(
          doc(db, "subjects", params.slug, "units", unit.id as string),
          unit,
        );
        unit.chapters.forEach((chapter) => {
          const chapterDocRef = doc(
            db,
            "subjects",
            params.slug,
            "units",
            unit.id as string,
            "chapters",
            chapter.id as string,
          );
          /* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */

          batch.set(
            chapterDocRef,
            {
              title: chapter,
            },
            {
              merge: true,
            },
          );
        });
      });
      // TODO: update Firestore security rules
      // It already have the correct permissions
      await batch.commit();
      alert("Subject content saved successfully.");
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const optInForUnitTest = (unitIndex: number): void => {
    const updatedSubject = { ...subject! };
    if (updatedSubject.units[unitIndex]) {
      updatedSubject.units[unitIndex].test = true;
      if (!updatedSubject.units[unitIndex].testId) {
        updatedSubject.units[unitIndex].testId = generateShortId();
      }
    }
    setSubject(updatedSubject);
    setUnsavedChanges(true);
  };

  const optOutOfUnitTest = (unitIndex: number): void => {
    const updatedSubject = { ...subject! };
    if (updatedSubject.units[unitIndex]?.test) {
      updatedSubject.units[unitIndex].test = false;
    }
    setSubject(updatedSubject);
    setUnsavedChanges(true);
  };

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }
  // Lines 347 and 362 have same issue as other eslint error above (line 209)
  /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
  return (
    <>
      {unsavedChanges && <Blocker />}

      <div className="relative min-h-screen">
        <main className="container max-w-3xl flex-grow px-4 pb-8 pt-10 md:px-10 lg:px-14 2xl:px-20">
          <div className="flex justify-between">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin"
            >
              <ArrowLeft className="mr-2" />
              Return to Admin Dashboard
            </Link>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSave}
            >
              <Save className="mr-2" /> Save Changes
            </Button>
          </div>
          <h1 className="mt-8 text-4xl font-bold">{subject?.title}</h1>
          <div className="my-4 space-y-4">
            {subject?.units.map((unit, unitIndex) => (
              <div key={unitIndex} className="rounded-lg border shadow-sm">
                <div className="flex items-center pl-4">
                  <MoveUp
                    className="size-7 cursor-pointer rounded-md transition-transform hover:scale-125"
                    onClick={() => moveUnitUp(unitIndex)}
                  />
                  <MoveDown
                    className="size-7 cursor-pointer rounded-md transition-transform hover:scale-125"
                    onClick={() => moveUnitDown(unitIndex)}
                  />
                  <Edit
                    onClick={() => setEditingUnit({ unitIndex })}
                    className="ml-4 size-7 cursor-pointer hover:text-blue-400"
                  />
                  <Trash
                    onClick={() => {
                      if (confirm("Delete this unit?")) {
                        deleteUnit(unitIndex);
                      }
                    }}
                    className="mx-2 size-7 cursor-pointer hover:text-red-500"
                  />
                  <button
                    className="flex w-full items-center justify-between p-4 text-lg font-semibold"
                    onClick={() =>
                      setExpandedUnits((prev) =>
                        prev.includes(unitIndex)
                          ? prev.filter((i) => i !== unitIndex)
                          : [...prev, unitIndex],
                      )
                    }
                  >
                    {editingUnit.unitIndex === unitIndex ? (
                      <input
                        defaultValue={unit.title}
                        ref={unitTitleInputRef}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => editUnitTitle(unitIndex, e.target.value)}
                        className="border border-blue-500"
                      />
                    ) : (
                      <span>{unit.title}</span>
                    )}
                    {expandedUnits.includes(unitIndex) ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </button>
                </div>
                {expandedUnits.includes(unitIndex) && (
                  <div className="border-t p-4">
                    {unit.chapters.map((chapter, chapterIndex) => (
                      <div
                        key={chapterIndex}
                        className="mb-3 flex items-center justify-between gap-4"
                      >
                        <a
                          className={buttonVariants({ variant: "outline" })}
                          href={encodeURI(
                            `/admin/subject/${params.slug}/${unit.id}/chapter/${chapter.id}?subject=${encodeURIComponent(subject.title)}&unit=${encodeURIComponent(unit.title)}&chapter=${encodeURIComponent(chapter.title as string)}`,
                          )}
                        >
                          Edit Content
                        </a>

                        {editingChapter.unitIndex === unitIndex &&
                        editingChapter.chapterIndex === chapterIndex ? (
                          <>
                            <p className="text-nowrap px-2">
                              Chapter {chapterIndex + 1}:
                            </p>
                            <input
                              autoFocus
                              className="-ml-5 w-full"
                              defaultValue={chapter.title as string}
                              ref={chapterInputRef}
                              onBlur={(e) =>
                                editChapterTitle(
                                  unitIndex,
                                  chapterIndex,
                                  e.target.value,
                                )
                              }
                            />
                          </>
                        ) : (
                          <p
                            onDoubleClick={() =>
                              setEditingChapter({ unitIndex, chapterIndex })
                            }
                            className="w-full cursor-pointer rounded-sm px-2 py-1 hover:bg-accent"
                          >
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </p>
                        )}

                        <Button
                          className="ml-auto"
                          variant={"destructive"}
                          onClick={() => deleteChapter(unitIndex, chapterIndex)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    ))}
                    <div className="mt-4 flex gap-2">
                      <Input
                        value={newChapterTitles[unitIndex] ?? ""}
                        onChange={(e) =>
                          setNewChapterTitles((prev) =>
                            prev.map((title, index) =>
                              index === unitIndex ? e.target.value : title,
                            ),
                          )
                        }
                        placeholder="New chapter title"
                        className="w-1/2"
                      />
                      <Button
                        onClick={() => addChapter(unitIndex)}
                        className="cursor-pointer bg-green-500 hover:bg-green-600"
                      >
                        <PlusCircle className="mr-2" /> Add Chapter
                      </Button>
                    </div>

                    {unit.test ? (
                      <div className="flex items-center">
                        <Link
                          href={`${pathname}/${unit.id}/test/${unit.testId}`}
                        >
                          <p className="mt-4 text-green-500 hover:underline">
                            Edit Unit Test
                          </p>
                        </Link>

                        <Button
                          className="ml-4 mt-4"
                          variant={"destructive"}
                          onClick={() => optOutOfUnitTest(unitIndex)}
                        >
                          Remove Unit Test
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="mt-4"
                        onClick={() => optInForUnitTest(unitIndex)}
                      >
                        Add Unit Test
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mb-4 flex items-center">
            <input
              className="mr-2 rounded border p-2"
              value={newUnitTitle}
              onChange={(e) => setNewUnitTitle(e.target.value)}
              placeholder="New unit title"
            />
            <Button
              onClick={addUnit}
              className="cursor-pointer bg-green-500 hover:bg-green-600"
            >
              <PlusCircle className="mr-2" /> Add Unit
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default Page;
