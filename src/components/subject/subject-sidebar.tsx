import { useState } from "react";
import { ChevronsLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { type Subject } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

      <div className="flex flex-col gap-2 pl-1.5">
        <Accordion
          className={cn(isCollapsed && "animate-hide")}
          type="multiple"
          defaultValue={props.subject.units.map((unit) => unit.title)}
        >
          {props.subject.units.map((unit) => (
            <AccordionItem
              className="border-none"
              value={unit.title}
              key={unit.title}
            >
              <AccordionTrigger className="flex justify-center pb-1.5 text-left text-lg font-semibold hover:no-underline">
                <span>
                  Unit {unit.unit} - {unit.title}
                </span>
              </AccordionTrigger>

              <AccordionContent className="flex flex-col gap-x-2 pb-0 pl-3">
                <div className="flex w-0.5 rounded-full bg-primary/50">
                  <span className="invisible opacity-0">.</span>
                </div>
                <div className="grow">
                  {unit.chapters.map((chapter) => (
                    <Link
                      className="group relative mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0 hover:underline"
                      key={chapter.title}
                      href={`${pathname.split("/").slice(0, 3).join("/")}/${unit.title
                        .toLowerCase()
                        .replace(/[^a-z1-9 ]+/g, "")
                        .replace(/\s/g, "-")}/${chapter.chapter}`}
                    >
                      <div className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-[.75rem] text-white">
                        {unit.unit}.{chapter.chapter}
                      </div>
                      <span>{chapter.title}</span>
                    </Link>
                  ))}
                  {unit.test?.optedIn && (
                    <Link
                      className="group relative mb-3 flex items-center gap-x-1.5 text-sm font-medium last:mb-0 hover:underline"
                      key={unit.test.instanceId}
                      href={`${pathname.split("/").slice(0, 3).join("/")}/${unit.unit}`}
                    >
                      <div className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-[.75rem] text-white">
                        {unit.unit}
                      </div>
                      <span>Unit Test</span>
                    </Link>
                  )}
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
