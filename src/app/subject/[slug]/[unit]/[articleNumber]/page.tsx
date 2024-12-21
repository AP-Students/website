"use client";
import Footer from "@/components/global/footer";
import Navbar from "@/components/global/navbar";
import SubjectBreadcrumb from "@/components/subject/subject-breadcrumb";
import SubjectSidebar from "@/components/subject/subject-sidebar";
import Renderer from "@/components/article-creator/Renderer";
import { useFetchAndCache } from "./useFetchAndCache";
import "katex/dist/katex.min.css";
import { useUser } from "@/components/hooks/UserContext";

const Page = ({
  params,
}: {
  params: { slug: string; unit: string; articleNumber: string };
}) => {
  const { user } = useUser();
  const { subject, content, loading, error } = useFetchAndCache(
    params,
    user?.access === "admin" || user?.access === "member",
  ); // Fetch with cache

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  if (subject && content) {
    const unitIndex = Number(params.unit.split("-")[1]) - 1;
    const chapterIndex = Number(params.articleNumber.split("-")[1]) - 1;
    const unitTitle = subject.units[unitIndex]?.title;
    const chapterTitle = subject.units[unitIndex]?.chapters[chapterIndex];

    if (!unitTitle || !chapterTitle) {
      return <div>Error: Unit or chapter not found.</div>;
    }

    return (
      <div className="relative flex min-h-screen">
        <SubjectSidebar subject={subject} />

        <div className="relative flex grow flex-col">
          <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

          <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
            <div className="grow md:ml-12">
              <SubjectBreadcrumb
                locations={[subject.title, unitTitle, chapterTitle]}
              />

              <h1 className="mb-9 mt-1 text-balance text-left text-5xl font-extrabold sm:text-6xl">
                {unitIndex + 1}.{chapterIndex + 1} - {chapterTitle}
              </h1>
              <Renderer content={content.data} />
            </div>
          </div>

          <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
        </div>
      </div>
    );
  } else {
    error;
  }
};

export default Page;
