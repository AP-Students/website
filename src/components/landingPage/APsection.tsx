import Link from "next/link";
import React from "react";
import { formatSlug } from "@/lib/utils";

interface SectionProps {
  title: string;
  numofCol: string;
  borderColor: string;
  courses: string[];
}

const APsection: React.FC<SectionProps> = ({
  title,
  courses,
  borderColor,
  numofCol,
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
            <li key={index} className="break-inside-avoid-column">
              <Link
                href={`/subject/${formatSlug(course.replace(/AP /g, ""))}`}
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
