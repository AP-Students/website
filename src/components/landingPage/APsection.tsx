"use client";

import Link from "next/link";
import React, { useState } from "react";
import { cn, formatSlug } from "@/lib/utils";
import { BookDashed, ExternalLink, HeartHandshake } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type urlInfo = {
  title: string;
  url: string;
};

type courseInfo = {
  title: string;
  referenceURLs?: urlInfo[];
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
            <APLink course={course} external={external} color={borderColor} key={index}></APLink>
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
  color: string;
}

const APLink: React.FC<LinkProps> = ({
  external,
  course,
  color,
}) => {

  return (
    <div>

      <Popover>
        <PopoverTrigger asChild>
            <h1
              className={cn(
                "hover:underline cursor-pointer",
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
        </PopoverTrigger>
        <PopoverContent className="flex flex-col justify-start align-start bg-background outline-0 rounded-lg z-40 px-5 py-2 shadow-lg"
        style={{
          border: `2px solid ${color}`,
        }}>
          <h1 className="text-3xl font-bold pb-1" style={{color: `${color}`}}>{course.title}</h1>
          {course.referenceURLs?.map((urlInfo, index) => (
            <a className="hover:underline py-0.5 opacity-75 cursor-pointer" key={index} target="_blank" href={urlInfo.url}>{urlInfo.title}</a>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
};

export default APsection;
