"use client";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatSlug } from "@/lib/utils";
import { type Unit } from "@/types/firestore";
import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

type Props = {
  unit: Unit;
  pathname: string;
  unitIndex: number;
};

const UnitAccordion = ({ unit, pathname, unitIndex }: Props) => {
  return (
    <AccordionItem
      className="mb-9 border-none"
      value={unit.title}
      key={unitIndex}
    >
      <AccordionTrigger
        id={unit.title}
        className="pb-1.5 text-left text-3xl font-semibold hover:no-underline sm:text-4xl"
      >
        {unit.title}
      </AccordionTrigger>

      <hr className="mb-3 mt-1.5 h-1 w-full" />

      <AccordionContent className="flex flex-col gap-3">
        {unit.chapters.map((chapter, chapterIndex) => (
          <Link
            className="group flex items-center gap-x-3 font-semibold last:mb-0"
            href={`${pathname.split("/").slice(0, 4).join("/")}/unit-${unitIndex + 1}-${unit.id}/chapter/${chapter.id}/${formatSlug(chapter.title)}`}
            key={chapterIndex}
          >
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-base font-bold text-white">
              {unitIndex + 1}.{chapterIndex + 1}
            </div>

            <div className="text-base font-medium group-hover:underline sm:text-lg">
              {chapter.title}
            </div>
          </Link>
        ))}
        {unit.test && (
          <Link
            className="group mb-3 flex items-center gap-x-3 font-semibold last:mb-0"
            href={`${pathname.split("/").slice(0, 4).join("/")}/unit-${unitIndex + 1}-${unit.id}/test/${unit.testId}`}
          >
            <BookOpenCheck className="size-8" />
            <div className="group-hover:underline">
              {unit.title === "Subject Test"
                ? unit.title
                : `Unit ${unitIndex + 1} Test`}
            </div>
          </Link>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
export default UnitAccordion;
