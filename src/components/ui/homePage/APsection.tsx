// Component for the different sections dividing the AP courses

import Link from "next/link";
import React from "react";

interface SectionProps {
  title: string;
  colSpanNumber: string;
  backgroundColor: string;
  courses: string[];
}

const APsection: React.FC<SectionProps> = ({
  title,
  courses,
  backgroundColor,    
  colSpanNumber,
}) => {
  return (
    <>
      <div
        className={`col-span-3 rounded-lg p-10 text-white ${"lg:col-span-" + colSpanNumber} lg:h-60`}
        style={{
          background: backgroundColor,
        }}
      >
        <h3 className="text-4xl font-bold text-white">{title}</h3>
      <ul className="mt-5 columns-1 space-y-4 sm:columns-2">
        {courses.map((course, index) => (
          <li key={index}>
            <Link href={`/${formatCourseName(course)}`}>{course}</Link>
          </li>
        ))}
      </ul>
      </div>
    </>
  );
};

const formatCourseName = (courseName: String) => {
  return courseName
    .replace(/AP /g, '')  
    .replace(/\s+/g, '-') 
    .toLowerCase();       
};


export default APsection;

