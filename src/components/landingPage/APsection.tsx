"use client";

import Link from "next/link";
import React, { useState } from "react";
import { cn, formatSlug } from "@/lib/utils";
import { BookDashed, ExternalLink, HeartHandshake } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";

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
          <li className="break-inside-avoid-column">
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
          </li>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col justify-start align-start bg-background outline-0 rounded-lg z-40 px-5 py-2 shadow-lg cursor-pointer"
        style={{
          border: `2px solid ${color}`,
        }}>
          <h1 className="text-3xl font-bold pb-1" style={{color: `${color}`}}>{course.title}</h1>
          {course.referenceURLs && course.referenceURLs.map((urlInfo) => (
            <h1 className="hover:underline py-0.5 opacity-75"
            onClick={
              () => {window.open(urlInfo.url, '_blank')}
            }>{urlInfo.title}</h1>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
};

export default APsection;
