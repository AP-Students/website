import { useState } from "react";
import { BookDashed, BookOpenCheck, ChevronsLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { type Subject } from "@/types/firestore";
import { cn, formatSlug } from "@/lib/utils";
import Link from "next/link";
import usePathname from "../client/pathname";

type Props = {
  subject: Subject;
};

const SubjectSidebar = (props: Props) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

      <div>
        <Accordion
          className={cn(isCollapsed && "hidden")}
          type="multiple"
          defaultValue={props.subject.units.map((unit) => unit.title)}
        >
          {props.subject.units.map((unit, unitIndex) => (
            <AccordionItem
              className="border-none"
              value={unit.title}
              key={unitIndex}
            >
              <AccordionTrigger className="text-balance pb-2 text-left">
                {unit.title}
              </AccordionTrigger>

              <AccordionContent className="flex flex-col gap-x-2 pb-0">
                <div className="grow">
                  {unit.chapters.map((chapter, chapterIndex) => (
                    <Link
                      className={cn(
                        "group relative mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0",
                        !chapter.isPublic && "pointer-events-none opacity-70",
                      )}
                      aria-disabled={!chapter.isPublic}
                      tabIndex={!chapter.isPublic ? -1 : undefined}
                      key={chapterIndex}
                      href={`${pathname.split("/").slice(0, 3).join("/")}/unit-${unitIndex + 1}-${unit.id}/chapter/${chapter.id}/${formatSlug(chapter.title)}`}
                    >
                      <div className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-[.75rem] text-white">
                        {unitIndex + 1}.{chapterIndex + 1}
                      </div>
                      <span className="text-balance group-hover:underline">
                        {chapter.title}
                      </span>
                      <p
                        className={cn(
                          "ml-auto text-nowrap rounded-full border border-gray-400 px-2 text-xs",
                          chapter.isPublic && "hidden",
                        )}
                      >
                        WIP
                      </p>
                    </Link>
                  ))}
                  {/* Handle multiple tests (unit.tests) first */}
                  {unit.tests ? (
                    unit.tests.map((test, testIndex) => (
                      <Link
                        className={cn(
                          "mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0 hover:underline",
                          !test.isPublic && "pointer-events-none opacity-70",
                        )}
                        aria-disabled={!test.isPublic}
                        tabIndex={!test.isPublic ? -1 : undefined}
                        href={`${pathname.split("/").slice(0, 4).join("/")}/unit-${unitIndex + 1}-${unit.id}/test/${test.id}`}
                        key={test.id}
                      >
                        {test.isPublic ? (
                          <BookOpenCheck className="size-6" />
                        ) : (
                          <BookDashed className="size-6 opacity-70" />
                        )}
                        <span className="text-balance">
                          {test.name
                            ? test.name
                            : // unit.tests cuz typescript doesn't recognize I checked for unit.tests already
                              `Unit ${unitIndex + 1} Test ${unit.tests && unit.tests.length > 1 ? ` ${testIndex + 1}` : ""}`}
                        </span>
                        <p
                          className={cn(
                            "ml-auto text-nowrap rounded-full border border-gray-400 px-2 text-xs",
                            test.isPublic && "hidden",
                          )}
                        >
                          WIP
                        </p>
                      </Link>
                    ))
                  ) : // Fallback: single test flow
                  unit.test && unit.testId ? (
                    <Link
                      className="mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0 hover:underline"
                      href={`${pathname.split("/").slice(0, 3).join("/")}/unit-${unitIndex + 1}-${unit.id}/test/${unit.testId}`}
                    >
                      <BookOpenCheck className="size-6" />
                      {unit.title === "Subject Test"
                        ? unit.title
                        : `Unit ${unitIndex + 1} Test`}
                    </Link>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default SubjectSidebar;
