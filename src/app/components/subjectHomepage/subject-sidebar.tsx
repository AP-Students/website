import { useEffect, useRef, useState } from "react";
import { ChevronsLeft, PlusCircle, Edit, Trash } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Button } from "@/app/components/ui/button";
import { type Subject, type Unit } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  subject: Subject;
};

const SubjectSidebar = (props: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [units, setUnits] = useState(props.subject.units);
  const [editingUnit, setEditingUnit] = useState<number | null>(null);
  const [editingChapter, setEditingChapter] = useState<{
    unitIndex: number | null;
    chapterIndex: number | null;
  }>({ unitIndex: null, chapterIndex: null });

  const [newUnitTitle, setNewUnitTitle] = useState<string>("");

  // UseRef for the input to auto-focus when editing
  const chapterInputRef = useRef<HTMLInputElement | null>(null);
  const unitInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the input when editingChapter changes
  useEffect(() => {
    if (chapterInputRef.current) {
      chapterInputRef.current.focus();
    }

    if (unitInputRef.current) {
      unitInputRef.current.focus();
    }
  }, [editingChapter, editingUnit]);

  // Handle adding a new chapter
  const addChapter = (unitIndex: number) => {
    if (units[unitIndex] === undefined) {
      return;
    }
    const newChapter = {
      chapter: units[unitIndex].chapters.length + 1,
      title: "",
    };
    const updatedUnits = [...units];
    updatedUnits[unitIndex]?.chapters.push(newChapter);
    setUnits(updatedUnits);
  };

  // Handle editing a chapter's title
  const editChapterTitle = (
    unitIndex: number,
    chapterIndex: number,
    newTitle: string,
  ) => {
    const updatedUnits = [...units];
    updatedUnits[unitIndex]!.chapters[chapterIndex]!.title = newTitle;
    setUnits(updatedUnits);
    setEditingChapter({ unitIndex: null, chapterIndex: null });
  };

  // Handle chapter delete
  const deleteChapter = (unitIndex: number, chapterIndex: number) => {
    const updatedUnits = [...units];
    updatedUnits[unitIndex]?.chapters.splice(chapterIndex, 1);
    setUnits(updatedUnits);
  };

  // Handle adding a new unit
  const addUnit = () => {
    const newUnit = {
      unit: units.length + 1,
      title: newUnitTitle || `Unit ${units.length + 1}`,
      chapters: [],
    };
    setUnits([...units, newUnit]);
    setNewUnitTitle(""); // Reset new unit title
  };

  // Handle editing a unit's title
  const editUnitTitle = (unitIndex: number, newTitle: string) => {
    const updatedUnits = [...units];
    updatedUnits[unitIndex]!.title = newTitle;
    setUnits(updatedUnits);
    setEditingUnit(null);
  };

  // Handle unit delete
  const deleteUnit = (unitIndex: number) => {
    const updatedUnits = [...units];
    updatedUnits.splice(unitIndex, 1);
    setUnits(updatedUnits);
  };

  const pathname = window.location.pathname;
  console.log("pathname", pathname);
  const isAdmin = pathname.split("/").includes("admin") ? "/admin" : "";

  return (
    <div
      className={cn(
        "sticky top-0 hidden max-h-screen shrink-0 bg-primary-foreground px-3 pb-12 pt-[11.5rem] lg:block",
        "overflow-y-auto overflow-x-hidden",
        "transition-all duration-300 ease-in-out",
        "scrollbar scrollbar-track-primary/10 scrollbar-thumb-primary/30 scrollbar-thumb-rounded-full scrollbar-w-1.5",
        isCollapsed ? "w-16" : "w-72",
      )}
    >
      <div className="flex items-center justify-between">
        <h2
          className={cn(
            "whitespace-nowrap text-2xl font-extrabold",
            isCollapsed && "animate-hide",
          )}
        >
          {props.subject.title}
        </h2>
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="group px-2 hover:bg-primary/50"
          variant={"ghost"}
        >
          <ChevronsLeft
            className={cn(
              "stroke-primary/50 stroke-[2px] transition-all duration-300 ease-in-out group-hover:stroke-white",
              isCollapsed && "rotate-180 transition-all",
            )}
          />
        </Button>
      </div>

      <div className="flex flex-col gap-2 pl-1.5">
        <Accordion
          className={cn(isCollapsed && "animate-hide")}
          type="multiple"
          defaultValue={units.map((unit) => unit.title)}
        >
          {units.map((unit, unitIndex) => (
            <AccordionItem
              className="border-none"
              value={unit.title}
              key={unit.title}
            >
              {/* Edit & Delete icons for unit */}
              {isAdmin === "/admin" && (
                <div className="opacity-0transition-opacity absolute right-0 z-10 flex gap-1 bg-primary-foreground duration-300 group-hover:opacity-100">
                  <Edit
                    className="z-20 cursor-pointer hover:text-blue-500"
                    onClick={() => {
                      setEditingUnit(unitIndex);
                    }}
                  />
                  <Trash
                    className="z-20 cursor-pointer hover:text-red-500"
                    onClick={() => {
                      deleteUnit(unitIndex);
                    }}
                  />
                </div>
              )}

              <AccordionTrigger
                className="flex justify-center pb-1.5 text-left text-lg font-semibold hover:no-underline"
                variant="secondary"
              >
                {editingUnit === unitIndex ? (
                  <input
                    className="w-52 truncate font-medium group-hover:underline"
                    defaultValue={unit.title}
                    ref={unitInputRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        editUnitTitle(unitIndex, e.currentTarget.value);
                      }
                    }}
                    onBlur={(e) =>
                      editUnitTitle(unitIndex, e.currentTarget.value)
                    }
                  />
                ) : (
                  <span>
                    Unit {unit.unit} - {unit.title}
                  </span>
                )}
              </AccordionTrigger>

              <AccordionContent className="flex flex-col gap-x-2 pb-0 pl-3">
                <div className="flex w-0.5 rounded-full bg-primary/50">
                  <span className="invisible opacity-0">.</span>
                </div>
                <div className="grow">
                  {unit.chapters.map((chapter, chapterIndex) => (
                    <div
                      className="group relative mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0"
                      key={chapter.title}
                    >
                      <div className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-[.75rem] text-white">
                        {unit.unit}.{chapter.chapter}
                      </div>
                      {editingChapter.unitIndex === unitIndex &&
                      editingChapter.chapterIndex === chapterIndex ? (
                        <input
                          className="w-52 truncate font-medium group-hover:underline"
                          defaultValue={chapter.title}
                          ref={chapterInputRef}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              editChapterTitle(
                                unitIndex,
                                chapterIndex,
                                e.currentTarget.value,
                              );
                            }
                          }}
                          onBlur={(e) =>
                            editChapterTitle(
                              unitIndex,
                              chapterIndex,
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        <Link
                          className="group flex items-center gap-x-1.5 text-sm font-medium last:mb-0 hover:underline"
                          // If user is on article pathway, having the slice doesn't prevent unintended appending of the article link
                          // All the functions used to make links work as expected
                          href={`${pathname.split("/").slice(0, 3).join("/")}/${unit.title
                            .toLowerCase()
                            .replace(/[^a-z1-9 ]+/g, "")
                            .replace(/\s/g, "-")}/${chapter.chapter}`}
                          key={chapter.title}
                        >
                          {chapter.title}
                        </Link>
                      )}

                      {/* Edit & Delete icons hover effect */}
                      {isAdmin === "/admin" && (
                        <div className="absolute right-0 z-10 flex gap-1 bg-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <Edit
                            className="cursor-pointer hover:text-blue-500"
                            onClick={() =>
                              setEditingChapter({ unitIndex, chapterIndex })
                            }
                          />
                          <Trash
                            className="cursor-pointer hover:text-red-500"
                            onClick={() =>
                              deleteChapter(unitIndex, chapterIndex)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add new chapter button */}
                  {isAdmin === "/admin" && (
                    <Button
                      className="flex items-center gap-x-1 text-sm"
                      variant="ghost"
                      onClick={() => addChapter(unitIndex)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Chapter
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Add new unit button */}
        {isAdmin === "/admin" && (
          <Button
            className="mt-4 flex items-center gap-x-1 text-sm"
            variant="ghost"
            onClick={addUnit}
          >
            <PlusCircle className="h-5 w-5" />
            Add Unit
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubjectSidebar;
