"use client";
import Renderer from "@/components/article-creator/Renderer";
import { useFetchAndCache } from "./useFetchAndCache";
import ChapterScaffold from "./ChapterScaffold";
import "katex/dist/katex.min.css";
import { useUser } from "@/components/hooks/UserContext";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Client-side chapter renderer for gated (non-public) chapters: it fetches the
 * content through Firestore with the signed-in user's auth, so members/admins can
 * preview WIP chapters. Public chapters are server-rendered by `page.tsx` and
 * never reach this component.
 */
const ChapterClient = ({
  params,
}: {
  params: { slug: string; unit: string; id: string };
}) => {
  const { user } = useUser();
  const { subject, content, loading, error } = useFetchAndCache(
    params,
    user?.access === "admin" || user?.access === "member",
  );

  useEffect(() => {
    if (subject && content) {
      const unitIndex = Number(params.unit.split("-")[1]) - 1;
      const chapterIndex = subject.units[unitIndex]!.chapters.findIndex(
        (ch) => ch.id === params.id,
      );
      const chapter = subject.units[unitIndex]!.chapters[chapterIndex];

      document.title = `FiveHive - ${subject.title} ${unitIndex + 1}.${chapterIndex + 1} - ${chapter?.title}`;
    }
  }, [subject, content, params.unit, params.id]);

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
      <ChapterScaffold
        subjectTitle={subject.title}
        units={subject.units}
        unitIndex={unitIndex}
        chapterIndex={chapterIndex}
        unitTitle={unitTitle}
        chapterTitle={chapter.title}
        chapterId={params.id}
        author={content.author}
      >
        <Renderer content={content.data} />
      </ChapterScaffold>
    );
  }

  return null;
};

export default ChapterClient;
