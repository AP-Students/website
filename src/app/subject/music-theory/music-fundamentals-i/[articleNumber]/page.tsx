"use client";
import Footer from "@/components/global/footer";
import Navbar from "@/components/global/navbar";
import SubjectBreadcrumb from "@/components/subject/subject-breadcrumb";
import SubjectSidebar from "@/components/subject/subject-sidebar";
import Renderer from "@/components/article-creator/Renderer";
import "katex/dist/katex.min.css";
import { notFound } from "next/navigation";
import { subject, units } from "@/lib/subject";


const Page = ({
  params,
}: {
  params: { articleNumber: string };
}) => {

  let articleNumber = 0;
  try {
    articleNumber = parseInt(params.articleNumber,10);
  } catch {
    return notFound();
  }

  if (articleNumber > 10 || articleNumber < 1){
    return notFound();
  }

  const content = units[articleNumber-1]!;

  const formattedTitle = `Article ${params.articleNumber} of Music Fundamentals I.`
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

    return (
      <div className="relative flex min-h-screen">
        <SubjectSidebar subject={subject} />

        <div className="relative flex grow flex-col">
          <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

          <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
            <div className="grow md:ml-12">
              <SubjectBreadcrumb subject={subject} />

              <h1 className="mb-9 mt-1 text-balance text-left text-5xl font-extrabold sm:text-6xl">
                {formattedTitle}
              </h1>
              <Renderer content={content.data} />
            </div>
          </div>

          <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
        </div>
      </div>
    );
};

export default Page;
