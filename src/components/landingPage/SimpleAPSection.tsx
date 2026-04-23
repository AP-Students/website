"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BookDashed, ExternalLink } from "lucide-react";

type courseInfo = {
  title: string;
  url: string;
};

interface SectionProps {
  title: string;
  numofCol: string;
  borderColor: string;
  courses: courseInfo[];
  external?: boolean;
  popover?: boolean;
}

const APsection: React.FC<SectionProps> = ({
  title,
  courses,
  borderColor,
  numofCol,
  external,
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
          {courses.map((course, index) => (
            <APLink course={course} external={external} key={index}></APLink>
          ))}
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
  external?: boolean;
  course: courseInfo;
}

const APLink: React.FC<LinkProps> = ({
  external,
  course
}) => {

  return (
    <a target="_blank" href={course.url}>
      <h1
        className={cn(
          "hover:underline cursor-pointer pb-1",
          external && "flex items-center gap-1",
          external &&
            !course.title.includes("|") &&
            "group opacity-50",
        )}
      >
        {external ? (
          course.title.includes("|") ? (
            <>
              <ExternalLink className="shrink-0" />
              {course.title.split(" | ")[0]}
            </>
          ) : (
            <>
              <BookDashed className="shrink-0" />
              <p>
                {course.title.split(" | ")[0]}
              </p>
            </>
          )
        ) : (
          course.title
        )}
      </h1>
    </a>
  )
};

export default APsection;
