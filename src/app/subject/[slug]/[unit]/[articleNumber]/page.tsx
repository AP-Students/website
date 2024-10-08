"use client";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { db } from "@/lib/firebase";
import { type Subject } from "@/types";
import SubjectBreadcrumb from "@/components/subjectHomepage/subject-breadcrumb";
import SubjectSidebar from "@/components/subjectHomepage/subject-sidebar";
import TableOfContents from "@/components/subjectHomepage/table-of-contents";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Content } from "@/types/content";
import { useUser } from "@/components/hooks/UserContext";
import {
  getKey,
  revertTableObjectToArray,
} from "@/app/article-creator/_components/ArticleCreator";
import { OutputData } from "@editorjs/editorjs";
import Renderer from "@/app/article-creator/_components/Renderer";

const Page = ({ params }: { params: { slug: string } }) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const { user, loading, error, setError, setLoading } = useUser();

  const pathParts = window.location.pathname.split("/").slice(-2);
  const formattedTitle =
    `Unit ${pathParts[1]?.charAt(0).toUpperCase() + pathParts[1]!.slice(1)}: ${pathParts[0]?.charAt(0).toUpperCase() + pathParts[0]!.slice(1)}`.replace(
      /-/g,
      " ",
    );

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          // Reference to the document in Firestore using the slug
          const subjectDocRef = doc(db, "subjects", params.slug);
          const subjectDocSnap = await getDoc(subjectDocRef);

          if (subjectDocSnap.exists()) {
            // Convert Firestore document data to Subject type
            setSubject(subjectDocSnap.data() as Subject);
          } else {
            setError("Subject not found. That's probably us, not you.");
          }

          const key = getKey();
          const pageDocRef = doc(db, "pages", key);
          const pageDocSnap = await getDoc(pageDocRef);

          if (pageDocSnap.exists()) {
            const data = pageDocSnap.data()?.data as OutputData;
            revertTableObjectToArray(data);
            pageDocSnap.data()!.data = data;
            setContent(pageDocSnap.data() as Content);
            console.log("Content:", pageDocSnap.data());
          } else {
            setError("Content not found. That's probably us, not you.");
          }
        }
      } catch (error) {
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    };

    if (user !== undefined) {
      fetchSubject();
    }
  }, [user]);

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
    {
      error;
    }
  }
};

export default Page;
