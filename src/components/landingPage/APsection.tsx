"use client";
import Link from "next/link";
import React from "react";

interface SectionProps {
  title: string;
  numofCol: string;
  backgroundColor: string;
  courses: string[];
}

const APsection: React.FC<SectionProps> = ({
  title,
  courses,
  backgroundColor,
  numofCol,
}) => {
  const domainName = window.location.origin;
  const currentPath = window.location.pathname;

  return (
    <>
      <div
        className={`col-span-3 rounded-lg p-10 text-white ${numofCol}`}
        style={{
          background: backgroundColor,
        }}
      >
        <h3 className="text-4xl font-bold text-white">{title}</h3>
        <ul
          className={`mt-5 columns-1 space-y-4 text-lg ${listMobile(+numofCol.replace(/[^1-9]/g, ""))}`}
        >
          {courses.map((course, index) => (
            <li key={index} className="break-inside-avoid-column">
              <Link
                href={`${domainName}/${currentPath}/subject/${formatCourseName(course)}`}
                className="hover:underline"
              >
                {course}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

const formatCourseName = (courseName: string) => {
  return courseName
    .replace(/AP /g, "")
    .toLowerCase()
    .replace(/[^a-z1-9 &]+/g, "")
    .replace(/\s+/g, "-");
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

export default APsection;
