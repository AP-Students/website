"use client";
import Footer from "@/components/global/footer";
import Navbar from "@/components/global/navbar";
import SubjectBreadcrumb from "@/components/subject/subject-breadcrumb";
import Renderer from "@/components/article-creator/Renderer";
import { useFetchAndCache } from "./useFetchAndCache";
import "katex/dist/katex.min.css";
import { useUser } from "@/components/hooks/UserContext";
import Image from "next/image";
import Link from "next/link";
import type { Unit } from "@/types/firestore";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatSlug } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

const Page = ({
  params,
}: {
  params: { slug: string; unit: string; id: string };
}) => {
  const { user } = useUser();
  const { subject, content, loading, error } = useFetchAndCache(
    params,
    user?.access === "admin" || user?.access === "member",
  );

  if (loading) {
    return (
      <div className="flex min-h-screen grow items-center justify-center text-2xl">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen grow place-content-center text-xl">
        <p>
          {error}
          <br />
          Return to{" "}
          <Link
            href={`/subject/${params.slug}`}
            className="text-blue-600 hover:underline"
          >
            subject homepage
          </Link>
          .
        </p>
      </div>
    );
  }

  if (subject && content) {
    const unitIndex = Number(params.unit.split("-")[1]) - 1;
    const chapterIndex = subject.units[unitIndex]!.chapters.findIndex(
      (ch) => ch.id === params.id,
    );
    const chapter = subject.units[unitIndex]!.chapters[chapterIndex];
    const unitTitle = subject.units[unitIndex]?.title;

    if (!unitTitle || !chapter) {
      return <div>Error: Unit or chapter not found.</div>;
    }

    return (
      <div className="relative flex grow flex-col">
        <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

        <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
          <div className="grow md:ml-12">
            <SubjectBreadcrumb
              locations={[subject.title, unitTitle, chapter.title]}
            />

            <h1 className="my-2 text-balance text-left text-5xl font-extrabold sm:text-6xl">
              {unitIndex + 1}.{chapterIndex + 1} - {chapter.title}
            </h1>
            <p className="mb-6 md:mb-10">{content.author}</p>

            <Renderer content={content.data} />
            <div className="flex pt-6">
              <PreviousArticle
                subjectTitle={subject.title}
                units={subject.units}
                unitIndex={unitIndex}
                chapterIndex={chapterIndex}
              />
              <NextArticle
                subjectTitle={subject.title}
                units={subject.units}
                unitIndex={unitIndex}
                chapterIndex={chapterIndex}
              />
            </div>
          </div>
        </div>

        <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
      </div>
    );
  } else {
    error;
  }
};

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

function AuthorCredits({
  displayName,
  photoURL,
}: {
  displayName: string;
  photoURL: string;
}) {
  return (
    <div className="mb-6 flex items-center space-x-2 text-sm text-gray-600 md:mb-10">
      <Image
        src={photoURL}
        alt={`${displayName}'s profile`}
        width={24}
        height={24}
        className="rounded-full"
      />
      <span className="ml-3 font-medium">{displayName}</span>
    </div>
  );
}

export default Page;
