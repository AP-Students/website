"use client";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import SubjectBreadcrumb from "@/components/subjectHomepage/subject-breadcrumb";
import SubjectSidebar from "@/components/subjectHomepage/subject-sidebar";
import TableOfContents from "@/components/subjectHomepage/table-of-contents";
import { useUser } from "@/components/hooks/UserContext";
import Renderer from "@/app/article-creator/_components/Renderer";
import { useFetchAndCache } from "./useFetchAndCache";

const Page = ({ params }: { params: { slug: string } }) => {
  const { user } = useUser(); // Get user state
  const { subject, content, loading, error } = useFetchAndCache(user, params); // Fetch with cache

  const pathParts = window.location.pathname.split("/").slice(-2);
  const formattedTitle = `Unit ${
    pathParts[1]?.charAt(0).toUpperCase() + pathParts[1]!.slice(1)
  }: ${
    pathParts[0]?.charAt(0).toUpperCase() + pathParts[0]!.slice(1)
  }`.replace(/-/g, " ");

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
    return (
      <div className="relative flex min-h-screen">
        <SubjectSidebar subject={subject} />

        <div className="relative flex grow flex-col">
          <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

          <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
            <div className="grow">
              <SubjectBreadcrumb subject={subject} />

              <h1 className="mb-9 mt-1 text-balance text-left text-5xl font-extrabold sm:text-6xl">
                {formattedTitle}
              </h1>
              <Renderer content={content.data} />
            </div>

            <TableOfContents title="UNITS" subject={subject} />
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
