import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { type Subject } from "@/lib/types";
import SubjectSidebar from "../../_components/subject-sidebar";
import TableOfContents from "../../_components/table-of-contents";

const Page = ({ params }: { params: { slug: string } }) => {
  const subject = {
    title: "AP Calculus AB",
    units: [
      {
        unit: 1,
        title: "Limits and Continuity",
        chapters: [
          {
            chapter: 1,
            title: "Introducing Calculus: Can Change Occur at an Instant?",
            src: "/chapter/1",
          },
          {
            chapter: 2,
            title: "Defining Limits and Using Limit Notation",
            src: "/chapter/2",
          },
          {
            chapter: 3,
            title: "Estimating Limit Values from Graphs",
            src: "/chapter/3",
          },
          {
            chapter: 4,
            title: "Estimating Limit Values from Tables",
            src: "/chapter/4",
          },
          {
            chapter: 5,
            title: "Determining Limits Using Algebraic Properties of Limits",
            src: "/chapter/5",
          },
          {
            chapter: 6,
            title: "Determining Limits Using Algebraic Manipulation",
            src: "/chapter/6",
          },
          {
            chapter: 7,
            title: "Selecting Procedures for Determining Limits",
            src: "/chapter/7",
          },
          {
            chapter: 8,
            title: "Determining Limits Using the Squeeze Theorem",
            src: "/chapter/8",
          },
          {
            chapter: 9,
            title: "Connecting Multiple Representations of Limits",
            src: "/chapter/9",
          },
          {
            chapter: 10,
            title: "Exploring Types of Discontinuities",
            src: "/chapter/10",
          },
          {
            chapter: 11,
            title: "Defining Continuity at a Point",
            src: "/chapter/11",
          },
          {
            chapter: 12,
            title: "Confirming Continuity over an Interval",
            src: "/chapter/12",
          },
          {
            chapter: 13,
            title: "Removing Discontinuities",
            src: "/chapter/13",
          },
          {
            chapter: 14,
            title: "Connecting Infinite Limits and Vertical Asymptotes",
            src: "/chapter/14",
          },
          {
            chapter: 15,
            title: "Connecting Limits at Infinity and Horizontal Asymptotes",
            src: "/chapter/15",
          },
          {
            chapter: 16,
            title: "Working with the Intermediate Value Theorem (IVT)",
            src: "/chapter/16",
          },
        ],
      },
      {
        unit: 2,
        title: "Differentiation: Definition and Basic Derivative Rules",
        chapters: [
          {
            chapter: 1,
            title:
              "Defining Average and Instantaneous Rates of Change at a Point",
            src: "/chapter/1",
          },
          {
            chapter: 2,
            title:
              "Defining the Derivative of a Function and Using Derivative Notation",
            src: "/chapter/2",
          },
          {
            chapter: 3,
            title: "Estimating Derivatives of a Function at a Point",
            src: "/chapter/3",
          },
          {
            chapter: 4,
            title:
              "Connecting Differentiability and Continuity: Determining When Derivatives Do and Do Not Exist",
            src: "/chapter/4",
          },
          {
            chapter: 5,
            title: "Applying the Power Rule",
            src: "/chapter/5",
          },
          {
            chapter: 6,
            title:
              "Derivative Rules: Constant, Sum, Difference, and Constant Multiple",
            src: "/chapter/6",
          },
          {
            chapter: 7,
            title: "Derivatives of cos x, sin x, e^x, and ln x",
            src: "/chapter/7",
          },
          {
            chapter: 8,
            title: "The Product Rule",
            src: "/chapter/8",
          },
          {
            chapter: 9,
            title: "The Quotient Rule",
            src: "/chapter/9",
          },
          {
            chapter: 10,
            title:
              "Finding the Derivatives of Tangent, Cotangent, Secant, and/or Cosecant Functions",
            src: "/chapter/10",
          },
        ],
      },
    ],
  } as Subject;

  return (
    <div className="relative flex min-h-screen">
      <SubjectSidebar subject={subject} />

      <div className="relative flex grow flex-col">
        <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

        <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
          <div className="grow">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/library">Library</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/library/ap-calc-ab">
                    {subject.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="mb-9 mt-1 text-balance text-left text-5xl font-extrabold sm:text-6xl">
              {subject.title}
            </h1>

            <Accordion
              className="w-full"
              type="multiple"
              defaultValue={subject.units.map((unit) => unit.title)}
            >
              {subject.units.map((unit) => (
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
                    {unit.chapters.map((chapter) => (
                      <Link
                        className="group mb-3 flex items-center gap-x-3 font-semibold last:mb-0"
                        href={chapter.src}
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
              ))}
            </Accordion>
          </div>

          <TableOfContents title="UNITS" subject={subject} />
        </div>

        <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
      </div>
    </div>
  );
};
export default Page;
