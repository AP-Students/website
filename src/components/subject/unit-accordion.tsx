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
      className="mb-3 border-none"
      value={unit.title}
      key={unitIndex}
    >
      <AccordionTrigger
        id={unit.title}
        className="text-balance pb-1.5 text-left text-3xl font-semibold hover:no-underline sm:text-4xl"
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
        {/* Handle multiple tests (unit.tests) first */}
        {unit.tests ? (
          unit.tests.map((test, testIndex) => (
            <Link
              className="flex items-center gap-x-3 font-semibold last:mb-0 hover:underline"
              href={`${pathname.split("/").slice(0, 4).join("/")}/unit-${unitIndex + 1}-${unit.id}/test/${test.id}`}
              key={test.id}
            >
              <BookOpenCheck className="size-8" />
              {test.name
                ? test.name
                : // unit.tests cuz typescript doesn't recognize I checked for unit.tests already
                  `Unit ${unitIndex + 1} Test ${unit.tests && unit.tests.length > 1 ? ` ${testIndex + 1}` : ""}`}
            </Link>
          ))
        ) : // Fallback: single test flow
        unit.test && unit.testId ? (
          <Link
            className="mb-3 flex items-center gap-x-3 font-semibold last:mb-0 hover:underline"
            href={`${pathname.split("/").slice(0, 4).join("/")}/unit-${unitIndex + 1}-${unit.id}/test/${unit.testId}`}
          >
            <BookOpenCheck className="size-8" />
            {unit.title === "Subject Test"
              ? unit.title
              : `Unit ${unitIndex + 1} Test`}
          </Link>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
};
export default UnitAccordion;
