"use client";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type Unit } from "@/types";
import Link from "next/link";

type Props = {
  unit: Unit;
};

const UnitAccordion = ({ unit }: Props) => {
  return (
    <AccordionItem
      className="mb-9 border-none"
      value={unit.title}
      key={unit.title}
    >
      <AccordionTrigger
        id={unit.title}
        className="pb-1.5 text-left text-3xl font-semibold hover:no-underline sm:text-4xl"
      >
        Unit {unit.unit} - {unit.title}
      </AccordionTrigger>

      <hr className="mb-3 mt-1.5 h-1 w-full" />

      <AccordionContent className="flex flex-col gap-2">
        {unit.chapters.map((chapter, index) => (
          <Link
            className="group mb-3 flex items-center gap-x-3 font-semibold last:mb-0"
            href={`${window.location.pathname}/${unit.title
              .toLowerCase()
              .replace(/[^a-z1-9 ]+/g, "")
              .replace(/\s/g, "-")}/${index + 1}`}
            key={chapter.title}
          >
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-primary text-center text-base font-bold text-white">
              {unit.unit}.{chapter.chapter}
            </div>

            <div className="text-base font-medium group-hover:underline sm:text-lg">
              {chapter.title}
            </div>
          </Link>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};
export default UnitAccordion;
