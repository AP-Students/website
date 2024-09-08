"use client";
import { useUser } from "@/app/components/hooks/UserContext";
import SubjectSidebar from "@/app/components/subjectHomepage/subject-sidebar";
import Footer from "@/app/components/ui/footer";
import Navbar from "@/app/components/ui/navbar";
import { db } from "@/lib/firebase";
import { Subject } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import apClassesData from "@/app/admin/apClasses.json";

const apClasses = apClassesData.apClasses;

// set empty data if non-existent
const emptyData: Subject = {
  title: "",
  units: [
    {
      unit: 1,
      title: "",
      chapters: [
        {
          chapter: 1,
          title: "",
        },
      ],
    },
  ],
};

const Page = ({ params }: { params: { slug: string } }) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const { user, loading, error, setError, setLoading } = useUser();

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSubject(docSnap.data() as Subject);
          } else {
            emptyData.title =
              apClasses.find(
                (apClass) =>
                  apClass
                    .replace(/AP /g, "")
                    .toLowerCase()
                    .replace(/[^a-z1-9 ]+/g, "")
                    .replace(/\s/g, "-") === params.slug,
              ) || "";
            setSubject(emptyData);
          }
        }
      } catch (error) {
        console.log("Error fetching subject data:", error);
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
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

  const handleSave = async () => {
    try {
      if (user && (user?.access === "admin" || user?.access === "member")) {
        // Save to Firestore
        await setDoc(doc(db, "subjects", params.slug), subject);

        setSubject(subject);
      } else {
        console.error("Error saving new unit and chapter:", error);
      }
    } catch (error) {
      console.error("Error saving new unit and chapter:", error);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      <SubjectSidebar subject={subject} />

      <div className="relative flex grow flex-col">
        <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

        <div className="relative flex grow flex-col">
          <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
            <div className="grow">
              <h1 className="flex justify-center py-8 text-5xl font-black">
                {subject.title}
              </h1>
              <h2 className="min-w-full py-8 text-center text-2xl font-black">
                Click on a unit or chapter to view its content. On the sidebar,
                you can create new units and chapters.
              </h2>

              <div className="flex min-w-full justify-center">
                <button
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Show new Unit and Chapter updates to users. (Save)
                </button>
              </div>
            </div>
          </div>

          <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
        </div>
      </div>
    </div>
  );
};

export default Page;
