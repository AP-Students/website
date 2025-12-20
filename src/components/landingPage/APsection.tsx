"use client";

import Link from "next/link";
import React, { useState } from "react";
import { cn, formatSlug } from "@/lib/utils";
import { Book, BookDashed, ExternalLink, HeartHandshake } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Resource = {
  title: string;
  url: string;
};

type Course = {
  title: string;
  referenceURLs?: Resource[];
};

interface SectionProps {
  title: string;
  numofCol: string;
  borderColor: string;
  courses: Course[];
  showReferenceList?: boolean;
  popover?: boolean;
}

const APsection: React.FC<SectionProps> = ({
  title,
  courses,
  borderColor,
  numofCol,
  showReferenceList,
}) => {
  return (
    <>
      <div
        className={`col-span-3 rounded-lg p-6 shadow ${numofCol}`}
        style={{
          border: `1px solid ${borderColor}`,
        }}
      >
        <h3
          className="text-4xl font-bold"
          style={{
            color: `${borderColor}`,
          }}
        >
          {title}
        </h3>
        <ul
          className={`mt-1 columns-1 space-y-2 text-lg ${listMobile(+numofCol.replace(/[^1-9]/g, ""))}`}
        >
          {courses.map((course, index) =>
            !showReferenceList ? (
              <SubjectLink course={course.title} index={index} />
            ) : (
              <ReferenceListItem color={borderColor} course={course} />
            ),
          )}
        </ul>
      </div>
    </>
  );
};

const listMobile = (columnNumber: number) => {
  let returnString = "";
  if (columnNumber === 3) {
    returnString = "sm:columns-2 md:columns-3";
  } else if (columnNumber === 2) {
    returnString = "sm:columns-2";
  }

  return returnString;
};

interface LinkProps {
  course: Course;
  color: string;
}

interface SubjectProps {
  index: number;
  course: string;
}

const SubjectLink: React.FC<SubjectProps> = ({ index, course }) => {
  return (
    <li key={index} className="break-inside-avoid-column">
      <Link
        href={`/subject/${formatSlug(course.replace(/AP /g, ""))}`}
        className="hover:underline"
      >
        {course}
      </Link>
    </li>
  );
};

const ReferenceListItem: React.FC<LinkProps> = ({ course, color }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <h1
          className={cn(
            "flex w-fit cursor-pointer items-center gap-1 hover:underline",
            course.referenceURLs &&
              course.referenceURLs?.length < 2 &&
              "opacity-50",
          )}
        >
          {course.referenceURLs && course.referenceURLs.length > 1 ? (
            <Book className="shrink-0" />
          ) : (
            <BookDashed className="shrink-0" />
          )}
          <p>{course.title}</p>
        </h1>
      </PopoverTrigger>
      <PopoverContent
        style={{
          border: `2px solid ${color}`,
        }}
      >
        <h1 className="pb-1 font-bold" style={{ color: `${color}` }}>
          {course.title}
        </h1>
        <ul className="list-inside list-disc">
          {course.referenceURLs?.map((resource, index) => (
            <li>
              <a
                className="py-0.5 opacity-75 hover:underline"
                key={index}
                href={resource.url}
              >
                {resource.title}
              </a>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default APsection;
