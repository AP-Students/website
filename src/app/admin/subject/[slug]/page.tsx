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
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link } from "../_components/link";
import apClassesData from "@/app/admin/apClasses.json";
import type { Subject } from "@/types";
import usePathname from "@/components/client/pathname";
import { Blocker } from "../_components/navigation-block";

const apClasses = apClassesData.apClasses;

// Empty subject template
const emptyData: Subject = {
  title: "",
  units: [
    {
      unit: 1,
      title: "",
      chapters: [
        {
          chapter: 1,
          title: "",
        },
      ],
      test: {
        questions: [],
        time: 0,
        optedIn: false,
        instanceId: "",
      },
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
  const [newChapterTitle, setNewChapterTitle] = useState("");

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
          } else {
            emptyData.title =
              apClasses.find(
                (apClass) =>
                  apClass
                    .replace(/AP /g, "")
                    .toLowerCase()
                    .replace(/[^a-z1-9 ]+/g, "")
                    .replace(/\s/g, "-") === params.slug,
              ) ?? "";
            setSubject(emptyData);
          }
        }
      } catch (error) {
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    })().catch((error) => {
      console.error("Error fetching questions:", error);
    });
  }, [user, params.slug, setError, setLoading]);

  const addUnit = () => {
    if (!newUnitTitle.trim() || !subject) return;
    const newUnit = {
      unit: subject.units.length + 1,
      title: newUnitTitle,
      chapters: [
        {
          chapter: 1,
          title: "",
        },
      ],
      test: {
        questions: [],
        time: 0,
        optedIn: false,
        instanceId: "",
      },
    };
    setSubject({ ...subject, units: [...subject.units, newUnit] });
    setNewUnitTitle("");
    setUnsavedChanges(true);
  };

  const deleteUnit = (unitIndex: number) => {
    if (!subject) return;
    const updatedUnits = [...subject.units];
    updatedUnits.splice(unitIndex, 1);
    // You need to go through the rest of the units behind the deleted unit and decrement their unit numbers
    for (let i = unitIndex; i < updatedUnits.length; i++) {
      updatedUnits[i]!.unit -= 1;
    }
    setSubject({ ...subject, units: updatedUnits });
    setUnsavedChanges(true);
  };

  const addChapter = (unitIndex: number) => {
    if (!newChapterTitle.trim() || !subject) return;
    const newChapter = {
      chapter: subject.units[unitIndex]!.chapters.length + 1 || 1,
      title: newChapterTitle,
    };
    const updatedUnits = [...subject?.units];
    updatedUnits[unitIndex]!.chapters.push(newChapter);
    setSubject({ ...subject, units: updatedUnits });
    setNewChapterTitle("");
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
    // You need to go through the rest of the units behind the deleted chapter and decrement their chapter numbers
    for (
      let i = chapterIndex;
      i < updatedUnits[unitIndex]!.chapters.length;
      i++
    ) {
      updatedUnits[unitIndex]!.chapters[i]!.chapter--;
    }
    setSubject({ ...subject, units: updatedUnits });
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "subjects", params.slug), subject);
      alert("Subject units and chapters saved.");
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const optInForUnitTest = (unitIndex: number): void => {
    const updatedSubject = { ...subject! };
    if (updatedSubject?.units[unitIndex]?.test) {
      updatedSubject.units[unitIndex].test.optedIn = true;
      updatedSubject.units[unitIndex].test.instanceId =
        `test_${params.slug}_${unitIndex}`;
    }
    setSubject(updatedSubject);
    setUnsavedChanges(true);
  };

  const optOutOfUnitTest = (unitIndex: number): void => {
    const updatedSubject = { ...subject! };
    if (updatedSubject?.units[unitIndex]?.test) {
      updatedSubject.units[unitIndex].test.optedIn = false;
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

  return (
    <>
      {unsavedChanges && <Blocker />}

      <div className="relative min-h-screen">
        <main className="container max-w-3xl flex-grow px-4 pb-8 pt-20 md:px-10 lg:px-14 2xl:px-20">
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
              <div key={unit.unit} className="rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <Edit
                    onClick={() => setEditingUnit({ unitIndex })}
                    className="ml-4 cursor-pointer hover:text-blue-400"
                  />

                  <Trash
                    onClick={() => deleteUnit(unitIndex)}
                    className="mx-2 cursor-pointer hover:text-red-500"
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
                        onBlur={(e) => editUnitTitle(unitIndex, e.target.value)}
                        className="border border-blue-500"
                      />
                    ) : (
                      <span>
                        Unit {unit.unit}: {unit.title}
                      </span>
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
                        key={chapter.chapter}
                        className="mb-3 flex items-center justify-between gap-4"
                      >
                        <a
                          className={buttonVariants({ variant: "outline" })}
                          href={`${pathname.split("/").slice(0, 4).join("/")}/${unit.title
                            .toLowerCase()
                            .replace(/[^a-z1-9 ]+/g, "")
                            .replace(/\s/g, "-")}/${chapter.chapter}`}
                        >
                          Edit Content
                        </a>

                        {editingChapter.unitIndex === unitIndex &&
                        editingChapter.chapterIndex === chapterIndex ? (
                          <>
                            <p className="text-nowrap px-2">
                              Chapter {chapter.chapter}:
                            </p>
                            <input
                              autoFocus
                              className="-ml-5 w-full"
                              defaultValue={chapter.title}
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
                            Chapter {chapter.chapter}: {chapter.title}
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
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
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

                    {unit.test?.optedIn ? (
                      <div className="flex items-center">
                        <Link
                          href={`${pathname.split("/").slice(0, 4).join("/")}/${unitIndex + 1}`}
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
