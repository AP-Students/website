// Component for the different sections dividing the AP courses

import Link from "next/link";
import React from "react";

interface SectionProps {
  title: string;
  numofCol: number;
  backgroundColor: string;
  courses: string[];
}

const APsection: React.FC<SectionProps> = ({
  title,
  courses,
  backgroundColor,
  numofCol,
}) => {
  const cols = `lg:col-span-${numofCol}`;
  return (
    <>
      <div
        className={`col-span-3 rounded-lg p-10 text-white ${cols} lg:h-60`}
        style={{
          background: backgroundColor,
        }}
      >
        <h3 className="text-4xl font-bold text-white">{title}</h3>
        <ul
          className={`mt-5 columns-1 space-y-4 ${listMobile(numofCol)}`}
        >
          {courses.map((course, index) => (
            <li key={index}>
              <Link href={`/subject/${formatCourseName(course)}`}>
                {course}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

const formatCourseName = (courseName: String) => {
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
