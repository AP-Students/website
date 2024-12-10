import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Unit, Subject } from "@/types";
import { Edit, Trash, ChevronUp, ChevronDown, Link, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

export default function SubjectDisplay({
    unit,
    unitIndex,
    subject,
    params,
    newChapterTitles,
    setNewChapterTitles,
    setSubject,
    setUnsavedChanges,
  }: {
    unit: Unit;
    unitIndex: number;
    subject: Subject;
    params: { slug: string };
    newChapterTitles: string[];
    setNewChapterTitles: React.Dispatch<React.SetStateAction<string[]>>;
    setSubject: (value: Subject) => void;
    setUnsavedChanges: (value: boolean) => void;
  }) {
    const pathname = usePathname();
    const unitTitleInputRef = useRef<HTMLInputElement | null>(null);
    const chapterInputRef = useRef<HTMLInputElement | null>(null);
  
    const [expandedUnits, setExpandedUnits] = useState<number[]>([]);
    const [editingUnit, setEditingUnit] = useState<{
      unitIndex: number | null;
    }>({ unitIndex: null });
    const [editingChapter, setEditingChapter] = useState<{
      unitIndex: number | null;
      chapterIndex: number | null;
    }>({ unitIndex: null, chapterIndex: null });
  
    const deleteUnit = (unitIndex: number) => {
      if (!subject) return;
      const updatedUnits = [...subject.units];
      updatedUnits.splice(unitIndex, 1);
      // You need to go through the rest of the units behind the deleted unit and decrement their unit numbers
      for (let i = unitIndex; i < updatedUnits.length; i++) {
        updatedUnits[i]!.unit -= 1;
      }
      setSubject({ ...subject, units: updatedUnits });
      // Remove the corresponding chapter title entry
      setNewChapterTitles((prev) =>
        prev.filter((_, index) => index !== unitIndex),
      );
      setUnsavedChanges(true);
    };
  
    const addChapter = (unitIndex: number) => {
      if (!newChapterTitles[unitIndex]?.trim() || !subject) return;
      const newChapter = {
        chapter: subject.units[unitIndex]!.chapters.length + 1 || 1,
        title: newChapterTitles[unitIndex],
      };
      const updatedUnits = [...subject.units];
      updatedUnits[unitIndex]!.chapters.push(newChapter);
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
  
    return (
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
            {expandedUnits.includes(unitIndex) ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
        {expandedUnits.includes(unitIndex) && (
          <div className="border-t p-4">
            {unit.chapters.map((chapter, chapterIndex) => (
              <div
                key={chapter.chapter}
                className="mb-3 flex items-center justify-between gap-4"
              >
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`${pathname.split("/").slice(0, 4).join("/")}/${unit.title
                    .toLowerCase()
                    .replace(/[^a-z1-9 ]+/g, "")
                    .replace(/\s/g, "-")}/${chapter.chapter}`}
                >
                  Edit Content
                </Link>
  
                {editingChapter.unitIndex === unitIndex &&
                editingChapter.chapterIndex === chapterIndex ? (
                  <>
                    <p className="text-nowrap px-2">Chapter {chapter.chapter}:</p>
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
    );
  }
  