"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronsLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { type Subject, type Unit } from "@/types";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type Props = {
  subject: Subject;
};

const SubjectSidebar = (props: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="z-10">
      <div className="fixed top-0 py-0 shadow sticky start-0 end-0 shadow-none">
        <div
          className={cn(
            'sticky top-0 bottom-0 flex flex-col'
          )}>
          <div
            className={
              cn('overflow-y-scroll no-bg-scrollbar w-[342px] grow bg-primary-foreground transition-all duration-300 ease-in-out scrollbar scrollbar-track-primary/10 scrollbar-thumb-primary/30 scrollbar-thumb-rounded-full',
              isCollapsed && 'w-[80px]')}
            style={{
              overscrollBehavior: 'contain',
            }}>
            <aside
              className={cn(
                `grow flex-col w-full pb-8 pb-0 max-w-custom-xs z-10 hidden block`
              )}>
              <nav
                role="navigation"
                className="w-full pt-6 scrolling-touch h-[100vh] grow pe-0 pe-3 ps-3 pb-16 md:pt-4 pt-4 scrolling-gpu">
                <div className="flex items-center justify-between">
                  <h2
                     className={cn(
                      "whitespace-nowrap text-2xl font-extrabold ml-2",
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
                <div className="flex flex-col gap-2 pl-1.5 pb-4">
                  <Accordion
                    className={cn(isCollapsed && "animate-hide")}
                    type="multiple"
                    defaultValue={props.subject.units.map((unit) => unit.title)}
                  >
                    {props.subject.units.map((unit) => (
                      <SidebarItem unit={unit} key={unit.title} />
                    ))}
                  </Accordion>
                </div>
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ unit }: { unit: Unit }) => {
  const pathname = usePathname();

  return (
    <AccordionItem className="border-none" value={unit.title} key={unit.title}>
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
              href={`${pathname}/${unit.title.toLowerCase().replace(/[^a-z1-9 ]+/g, "").replace(/\s/g, "-")}/${chapter.chapter}`}
              key={chapter.title}
            > 
              <div className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-[.75rem] text-white">
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
  );
};
export default SubjectSidebar;
