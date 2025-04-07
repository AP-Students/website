import Link from "next/link";
import React from "react";
import { cn, formatSlug } from "@/lib/utils";
import { BookDashed, ExternalLink, HeartHandshake } from "lucide-react";

interface SectionProps {
  title: string;
  numofCol: string;
  borderColor: string;
  courses: string[];
  external?: boolean;
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
            <li key={index} className="break-inside-avoid-column">
              <Link
                href={
                  external
                    ? `${course.includes("|") ? course.split(" | ")[1] : "/apply"}`
                    : `/subject/${formatSlug(course.replace(/AP /g, ""))}`
                }
                target={external && course.includes("|") ? "_blank" : "_self"}
                rel={
                  external && course.includes("|") ? "noreferrer" : undefined
                }
                className={cn(
                  "hover:underline",
                  external && "flex items-center gap-1",
                  external &&
                    !course.includes("|") &&
                    "group opacity-50 hover:text-amber-500 hover:opacity-100",
                )}
              >
                {external ? (
                  course.includes("|") ? (
                    <>
                      <ExternalLink className="shrink-0" />
                      {course.split(" | ")[0]}
                    </>
                  ) : (
                    <>
                      <BookDashed className="shrink-0 group-hover:hidden" />
                      <HeartHandshake className="hidden shrink-0 group-hover:block" />
                      <p className="group-hover:hidden">
                        {course.split(" | ")[0]}
                      </p>
                      <p className="hidden group-hover:block">
                        Apply to join FiveHive
                      </p>
                    </>
                  )
                ) : (
                  course
                )}
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
