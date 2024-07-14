"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { type Subject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { ChevronsLeft } from "lucide-react";
type Props = {
  subject: Subject;
};

const SubjectSidebar = (props: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "scrollbar scrollbar-w-1.5 scrollbar-track-primary/10 scrollbar-thumb-primary/30 scrollbar-thumb-rounded-full sticky top-0 hidden max-h-screen overflow-y-auto overflow-x-hidden bg-primary-foreground px-3 pb-12 pt-[11.5rem] transition-all duration-300 ease-in-out lg:block",
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
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
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
          className={cn(isCollapsed ? "animate-hide" : "")}
          type="multiple"
        >
          {props.subject.units.map((unit) => (
            <AccordionItem
              className="border-none"
              value={unit.title}
              key={unit.title}
            >
              <AccordionTrigger
                className="pb-1.5 text-left text-lg font-semibold hover:no-underline"
                variant="secondary"
              >
                <span className="w-[14.75rem] truncate">
                  Unit {unit.unit} - {unit.title}
                </span>
              </AccordionTrigger>

              <AccordionContent className="flex gap-x-2 pb-0 pl-3">
                <div className="flex w-0.5 rounded-full bg-primary/50">
                  <span className="invisible opacity-0">.</span>
                </div>
                <div className="grow">
                  {unit.chapters.map((chapter) => (
                    <Link
                      className="group mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0"
                      href={chapter.src}
                      key={chapter.title}
                    >
                      <div className="flex size-6 items-center justify-center rounded bg-primary text-center text-[.75rem] text-white">
                        {unit.unit}.{chapter.chapter}
                      </div>

                      <div className="w-52 truncate font-medium group-hover:underline">
                        {chapter.title}
                      </div>
                    </Link>
                  ))}
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
