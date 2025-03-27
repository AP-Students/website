"use client";

import SubjectSidebar from "@/components/subject/subject-sidebar";
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";

import { type Subject } from "@/types/firestore";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const docRef = doc(db, "subjects", params.slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSubject(docSnap.data() as Subject);
        } else {
          setError("Subject not found. That's probably us, not you.");
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject().catch((error) => {
      console.error(error);
    });
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl">
        Loading...
      </div>
    );
  }

  if (error ?? !subject) {
    return (
      <div className="grid min-h-screen place-content-center text-xl">
        <p>
          {error}
          <br />
          Return to{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            FiveHive&apos;s homepage
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      <SubjectSidebar
        subject={subject}
        preview={user?.access === "member" || user?.access === "admin"}
      />
      {children}
    </div>
  );
}
