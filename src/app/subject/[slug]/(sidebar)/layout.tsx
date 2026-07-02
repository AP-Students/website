"use client";

import SubjectSidebar from "@/components/subject/subject-sidebar";
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";

import { type Subject } from "@/types/firestore";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useUser } from "@/components/hooks/UserContext";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}) {
  const { user } = useUser();

  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (user === undefined) return;

    const fetchSubject = async () => {
      try {
        const isAuthorized = user && (user.access === "admin" || user.access === "member" || user.access === "grader");
        if (params.slug === "porting" && !isAuthorized) {
          return;
        }
        const docRef = doc(db, "subjects", params.slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSubject(docSnap.data() as Subject);
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };

    fetchSubject().catch((error) => {
      console.error(error);
    });
  }, [params.slug, user]);

  // `{children}` must always render: this layout wraps server-rendered chapter
  // pages, and short-circuiting on the client `loading`/`error` state (which is
  // `loading === true` during SSR) would strip the chapter content and its
  // page-level JSON-LD out of the static HTML. The sidebar's own subject fetch is
  // independent of the page, so a sidebar load failure just omits the rail — the
  // page renders (and surfaces any content errors) regardless.
  return (
    <div className="relative flex min-h-screen">
      {subject ? (
        <SubjectSidebar
          subject={subject}
          preview={user?.access === "member" || user?.access === "admin"}
        />
      ) : null}
      {children}
    </div>
  );
}
