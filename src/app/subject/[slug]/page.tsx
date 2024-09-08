"use client";
import { Accordion } from "@/components/ui/accordion";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { db } from "@/lib/firebase";
import { type Subject } from "@/types";
import SubjectBreadcrumb from "@/components/subjectHomepage/subject-breadcrumb";
import SubjectSidebar from "@/components/subjectHomepage/subject-sidebar";
import TableOfContents from "@/components/subjectHomepage/table-of-contents";
import UnitAccordion from "@/components/subjectHomepage/unit-accordion";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getUser } from "@/components/hooks/users";
import { User } from "@/types/user";
import Link from "next/link";

const Page = ({ params }: { params: { slug: string } }) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notAuthenticated, setNotAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        if (user) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSubject(docSnap.data() as Subject);
          } else {
            setError("Subject not found. That's probably us, not you.");
          }
        } else {
          setNotAuthenticated(true); // Trigger not authenticated state if user is null
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
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

  if (notAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-3xl">
        <span className="mb-4">Log in or sign up to view this subject.</span>

        <Link
          href="/login"
          className="rounded-md py-2 text-xl text-blue-500 hover:underline"
        >
          Log in for FiveHive to view this subject.
        </Link>

        <Link
          href="/signup"
          className="rounded-md py-2 text-xl text-blue-500 hover:underline"
        >
          Sign up for FiveHive to view this subject.
        </Link>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      <SubjectSidebar subject={subject} />

      <div className="relative flex grow flex-col">
        <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

        <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
          <div className="grow">
            <SubjectBreadcrumb subject={subject} />

            <h1 className="mb-9 mt-1 text-balance text-left text-5xl font-extrabold sm:text-6xl">
              {subject.title}
            </h1>

            <Accordion
              className="w-full"
              type="multiple"
              defaultValue={subject.units.map((unit) => unit.title)}
            >
              {subject.units.map((unit) => (
                <UnitAccordion unit={unit} key={unit.title} />
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
