"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Subject } from "@/types/firestore";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type Props = {
  title: string;
  subject: Subject;
};

const TableOfContents = ({ title, subject }: Props) => {
  const router = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "sticky top-8 z-10 hidden max-h-[100vh] shrink-0 flex-col overflow-y-auto transition-all lg:flex",
        collapsed ? "w-32" : "w-[16rem]",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xl font-semibold uppercase tracking-[0.12em]">
          {title}
        </div>
        <Button
          onClick={() => setCollapsed(!collapsed)}
          className="group px-2 hover:bg-primary/50"
          variant={"ghost"}
        >
          <ChevronRight
            className={cn(
              "stroke-primary stroke-[2px] transition-all group-hover:stroke-white",
              collapsed && "rotate-180",
            )}
          />
        </Button>
      </div>

      <div className={cn("flex flex-col gap-1", collapsed && "animate-hide")}>
        {subject.units.map((unit, unitIndex) => (
          <div key={unitIndex}>
            <Link
              href={`${router.split("/").slice(0, 3).join("/")}#${unit.title}`}
              key={unit.title}
              className={cn(
                "flex items-center gap-3 text-base font-medium opacity-50 transition-all hover:text-primary/70 hover:opacity-100",
                collapsed && "whitespace-nowrap",
              )}
            >
              {unit.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
export default TableOfContents;
