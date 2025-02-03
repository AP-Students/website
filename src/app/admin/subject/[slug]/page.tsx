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
import type { Subject, Unit, UnitTest } from "@/types/firestore";
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

// Updated empty subject template using the new data types
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
      tests: [] // No tests by default for a new unit
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

const Page = ({ params }: { params: { slug: string } }) => {
  const pathname = usePathname();
  const { user, error, setError, setLoading } = useUser();
  const [subject, setSubject] = useState<Subject>();
  const [expandedUnits, setExpandedUnits] = useState<number[]>([]);

  const [editingUnit, setEditingUnit] = useState<{ unitIndex: number | null }>({ unitIndex: null });
  const [editingChapter, setEditingChapter] = useState<{ unitIndex: number | null; chapterIndex: number | null }>({
    unitIndex: null,
    chapterIndex: null,
  });
  // New state for inline editing of tests:
  const [editingTest, setEditingTest] = useState<{ unitIndex: number | null; testIndex: number | null }>({
    unitIndex: null,
    testIndex: null,
  });

  const [newUnitTitle, setNewUnitTitle] = useState("");

  // Initialize newChapterTitles as an empty array, one per unit
  const [newChapterTitles, setNewChapterTitles] = useState<string[]>([]);
  // New state arrays for adding tests: one entry per unit for test name and test time.
  const [newTestNames, setNewTestNames] = useState<string[]>([]);
  const [newTestTimes, setNewTestTimes] = useState<string[]>([]);

  const unitTitleInputRef = useRef<HTMLInputElement | null>(null);
  const chapterInputRef = useRef<HTMLInputElement | null>(null);
  // Ref for inline editing of tests:
  const testInputRef = useRef<HTMLInputElement | null>(null);

  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  useEffect(() => {
    // Fetch subject data
    (async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const fetched = docSnap.data() as Subject;
            setSubject(fetched);
            const unitsLength = fetched.units.length;
            setNewChapterTitles(Array(unitsLength).fill(""));
            setNewTestNames(Array(unitsLength).fill(""));
            setNewTestTimes(Array(unitsLength).fill("0"));
          } else {
            // When subject not found, use emptyData and also set the subject title from the AP classes list.
            const newSubject = {
              ...structuredClone(emptyData),
              title:
                apClasses.find(
                  (apClass) =>
                    formatSlug(apClass.replace(/AP /g, "")) === params.slug,
                ) ?? "",
            };
            setSubject(newSubject);
            const unitsLength = newSubject.units.length;
            setNewChapterTitles(Array(unitsLength).fill(""));
            setNewTestNames(Array(unitsLength).fill(""));
            setNewTestTimes(Array(unitsLength).fill("0"));
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
    setSubject({ ...subject, units: [...subject.units, newUnit] });
    setNewUnitTitle("");
    // Add a new entry for the new unit in newChapterTitles and newTest* arrays
    setNewChapterTitles((prev) => [...prev, ""]);
    setNewTestNames((prev) => [...prev, ""]);
    setNewTestTimes((prev) => [...prev, "0"]);
    setUnsavedChanges(true);
  };

  const deleteUnit = (unitIndex: number) => {
    if (!subject) return;
    const updatedUnits = [...subject.units];
    updatedUnits.splice(unitIndex, 1);
    setSubject({ ...subject, units: updatedUnits });
    // Remove the corresponding chapter and test title entries
    setNewChapterTitles((prev) => prev.filter((_, index) => index !== unitIndex));
    setNewTestNames((prev) => prev.filter((_, index) => index !== unitIndex));
    setNewTestTimes((prev) => prev.filter((_, index) => index !== unitIndex));
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

  const editChapterTitle = (unitIndex: number, chapterIndex: number, newTitle: string) => {
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

  // ==== New functions for multiple Unit Tests ====
  const addTest = (unitIndex: number) => {
    if (!newTestNames[unitIndex]?.trim() || !subject) return;
    const newTest: UnitTest = {
      id: generateShortId(),
      name: newTestNames[unitIndex],
      questions: [],
      time: Number(newTestTimes[unitIndex]) || 0,
    };
    const updatedUnits = [...subject.units];
    if (!updatedUnits[unitIndex]?.tests) {
      updatedUnits[unitIndex]!.tests = [];
    }
    updatedUnits[unitIndex]!.tests.push(newTest);
    setSubject({ ...subject, units: updatedUnits });
    setNewTestNames((prev) => prev.map((val, index) => (index === unitIndex ? "" : val)));
    setNewTestTimes((prev) => prev.map((val, index) => (index === unitIndex ? "0" : val)));
    setUnsavedChanges(true);
  };

  const deleteTest = (unitIndex: number, testIndex: number) => {
    if (!subject) return;
    const updatedUnits = [...subject.units];
    updatedUnits[unitIndex]?.tests?.splice(testIndex, 1);
    setSubject({ ...subject, units: updatedUnits });
    setUnsavedChanges(true);
  };

  const editTestName = (unitIndex: number, testIndex: number, newName: string) => {
    if (!subject) return;
    if (newName.trim().length === 0) {
      alert("Test name cannot be empty.");
      return;
    } else {
      const updatedUnits = [...subject.units];
      if (updatedUnits[unitIndex]?.tests?.[testIndex]) {
        updatedUnits[unitIndex].tests[testIndex].name = newName;
      }
      setSubject({ ...subject, units: updatedUnits });
      setEditingTest({ unitIndex: null, testIndex: null });
      setUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "subjects", params.slug), subject);
      subject?.units.forEach((unit) => {
        // Save the unit document
        batch.set(doc(db, "subjects", params.slug, "units", unit.id), unit);
        // Save each chapter under this unit
        unit.chapters.forEach((chapter) => {
          const chapterDocRef = doc(
            db,
            "subjects",
            params.slug,
            "units",
            unit.id,
            "chapters",
            chapter.id,
          );
          batch.set(
            chapterDocRef,
            { title: chapter },
            { merge: true },
          );
        });
        // Save each test under this unit
        unit.tests?.forEach((test) => {
          const testDocRef = doc(
            db,
            "subjects",
            params.slug,
            "units",
            unit.id,
            "tests",
            test.id,
          );
          batch.set(
            testDocRef,
            test,
            { merge: true },
          );
        });
      });
      
      await batch.commit();
      alert("Subject content saved successfully.");
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
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
                {/* Unit Header */}
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
                    {/* Chapter Content */}
                    {unit.chapters.map((chapter, chapterIndex) => (
                      <div
                        key={chapterIndex}
                        className="mb-3 flex items-center justify-between gap-4"
                      >
                        <a
                          className={buttonVariants({ variant: "outline" })}
                          href={encodeURI(
                            `/admin/subject/${params.slug}/${unit.id}/chapter/${chapter.id}?subject=${encodeURIComponent(subject.title)}&unit=${encodeURIComponent(unit.title)}&chapter=${encodeURIComponent(chapter.title)}`,
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
                              defaultValue={chapter.title}
                              ref={chapterInputRef}
                              onBlur={(e) =>
                                editChapterTitle(unitIndex, chapterIndex, e.target.value)
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

                    {/* Unit Tests Section */}
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold">Unit Tests (Name, Time)</h3>
                      {unit.tests?.map((test, testIndex) => (
                        <div key={testIndex} className="mb-3 flex items-center justify-between gap-4">
                          <a
                            className={buttonVariants({ variant: "outline" })}
                            href={encodeURI(
                              `/admin/subject/${params.slug}/${unit.id}/test/${test.id}?subject=${encodeURIComponent(subject.title)}&unit=${encodeURIComponent(unit.title)}&test=${encodeURIComponent(test.name!)}`,
                            )}
                          >
                            Edit Test
                          </a>
                          {editingTest.unitIndex === unitIndex && editingTest.testIndex === testIndex ? (
                            <>
                              <p className="text-nowrap px-2">Test {testIndex + 1}:</p>
                              <input
                                autoFocus
                                className="-ml-5 w-full"
                                defaultValue={test.name}
                                ref={testInputRef}
                                onBlur={(e) => editTestName(unitIndex, testIndex, e.target.value)}
                              />
                            </>
                          ) : (
                            <p
                              onDoubleClick={() =>
                                setEditingTest({ unitIndex, testIndex })
                              }
                              className="w-full cursor-pointer rounded-sm px-2 py-1 hover:bg-accent"
                            >
                              Test {testIndex + 1}: {test.name} {test.time ? `- ${test.time} mins` : ""}
                            </p>
                          )}
                          <Button
                            className="ml-auto"
                            variant={"destructive"}
                            onClick={() => deleteTest(unitIndex, testIndex)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      ))}
                      <div className="mt-4 flex gap-2">
                        <Input
                          value={newTestNames[unitIndex] ?? ""}
                          onChange={(e) =>
                            setNewTestNames((prev) =>
                              prev.map((title, index) => (index === unitIndex ? e.target.value : title))
                            )
                          }
                          placeholder="New test name"
                          className="w-1/3"
                        />
                        <Input
                          type="number"
                          value={newTestTimes[unitIndex] ?? "0"}
                          onChange={(e) =>
                            setNewTestTimes((prev) =>
                              prev.map((time, index) => (index === unitIndex ? e.target.value : time))
                            )
                          }
                          placeholder="Test time (mins)"
                          className="w-1/3"
                        />
                        <Button
                          onClick={() => addTest(unitIndex)}
                          className="cursor-pointer bg-green-500 hover:bg-green-600"
                        >
                          <PlusCircle className="mr-2" /> Add Test
                        </Button>
                      </div>
                    </div>
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
