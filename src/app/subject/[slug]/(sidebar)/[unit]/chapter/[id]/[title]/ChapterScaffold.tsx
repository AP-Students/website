import Footer from "@/components/global/footer";
import Navbar from "@/components/global/navbar";
import SubjectBreadcrumb from "@/components/subject/subject-breadcrumb";
import ProgressTracker from "@/components/subject/progress-tracker";
import Link from "next/link";
import type { Unit } from "@/types/firestore";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatSlug } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Presentational chapter shell shared by the public (server-rendered) and gated
 * (client) paths so the two never drift. Has no data fetching or hooks of its
 * own; the body — server-rendered article or client `Renderer` — is passed as
 * `children`. `Navbar`/`ProgressTracker` are client components rendered within.
 */
export default function ChapterScaffold({
  subjectTitle,
  units,
  unitIndex,
  chapterIndex,
  unitTitle,
  chapterTitle,
  chapterId,
  author,
  children,
}: {
  subjectTitle: string;
  units: Unit[];
  unitIndex: number;
  chapterIndex: number;
  unitTitle: string;
  chapterTitle: string;
  chapterId: string;
  author: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex grow flex-col">
      <Navbar hideLinks />

      <div className="relative mt-8 flex justify-between gap-x-16 px-10 lg:mt-16 xl:px-20">
        <div className="flex grow flex-col items-center">
          <SubjectBreadcrumb
            locations={[subjectTitle, unitTitle, chapterTitle]}
          />

          <h1 className="my-2 text-balance text-center text-5xl font-extrabold">
            {unitIndex + 1}.{chapterIndex + 1} - {chapterTitle}
          </h1>
          <p>{author}</p>
          <div className="my-4">
            <ProgressTracker chapterId={chapterId} />
          </div>

          {children}
        </div>
      </div>
      <div className="mt-auto flex justify-center">
        <div className="flex max-w-[65ch] grow gap-3 pt-6">
          <PreviousArticle
            subjectTitle={subjectTitle}
            units={units}
            unitIndex={unitIndex}
            chapterIndex={chapterIndex}
          />
          <NextArticle
            subjectTitle={subjectTitle}
            units={units}
            unitIndex={unitIndex}
            chapterIndex={chapterIndex}
          />
        </div>
      </div>

      <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
    </div>
  );
}

function PreviousArticle({
  subjectTitle,
  units,
  unitIndex,
  chapterIndex,
}: {
  subjectTitle: string;
  units: Unit[];
  unitIndex: number;
  chapterIndex: number;
}) {
  let unit = units[unitIndex];
  let newUnitIndex = unitIndex;
  let newChapterIndex = chapterIndex;

  if (chapterIndex <= 0) {
    if (unitIndex <= 0) return null;
    newUnitIndex -= 1;
    unit = units[newUnitIndex];
    if (!unit?.chapters) return null;
    newChapterIndex = unit.chapters.length - 1;
  } else {
    newChapterIndex -= 1;
  }

  if (!unit) return null;

  const subjectSlug = formatSlug(subjectTitle.replace(/AP /g, ""));

  return (
    <Link
      href={`/subject/${subjectSlug}/unit-${newUnitIndex + 1}-${unit.id}/chapter/${unit.chapters[newChapterIndex]?.id}/${formatSlug(unit.chapters[newChapterIndex]?.title ?? "")}`}
      className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
    >
      <ArrowLeft />
      Previous Chapter
    </Link>
  );
}

function NextArticle({
  subjectTitle,
  units,
  unitIndex,
  chapterIndex,
}: {
  subjectTitle: string;
  units: Unit[];
  unitIndex: number;
  chapterIndex: number;
}) {
  let unit = units[unitIndex];
  let newUnitIndex = unitIndex;
  let newChapterIndex = chapterIndex;

  if (!unit?.chapters) return null;

  if (chapterIndex >= unit.chapters.length - 1) {
    if (unitIndex >= units.length - 1) return null;
    newUnitIndex += 1;
    unit = units[newUnitIndex];
    newChapterIndex = 0;
  } else {
    newChapterIndex += 1;
  }

  if (!unit) return null;

  const subjectSlug = formatSlug(subjectTitle.replace(/AP /g, ""));

  return (
    <Link
      href={`/subject/${subjectSlug}/unit-${newUnitIndex + 1}-${unit.id}/chapter/${unit.chapters[newChapterIndex]?.id}/${formatSlug(unit.chapters[newChapterIndex]?.title ?? "")}`}
      className={cn(buttonVariants({ variant: "outline" }), "ml-auto gap-2")}
    >
      Next Chapter
      <ArrowRight />
    </Link>
  );
}
