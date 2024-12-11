"use client";
import { useState, useEffect } from "react";
import {
  PlusCircle,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link } from "@/app/admin/subject/link";
import apClassesData from "@/components/apClasses.json";
import type { Subject } from "@/types";
import { Blocker } from "@/app/admin/subject/navigation-block";
import UnitDisplay from "./UnitDisplay";

const apClasses = apClassesData.apClasses;

// Empty subject template
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
      test: {
        questions: [],
        time: 0,
        optedIn: false,
        instanceId: "",
      },
    },
  ],
};

const Page = ({ params }: { params: { slug: string } }) => {
  const { user, error, setError } = useUser();

  const [loading, setLoading] = useState<boolean>(false);
  const [subject, setSubject] = useState<Subject>();
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newChapterTitles, setNewChapterTitles] = useState<string[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  useEffect(() => {
    // Fetch subject data
    (async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSubject(docSnap.data() as Subject);
            // Initialize newChapterTitles with empty strings for each unit
            const unitsLength = (docSnap.data() as Subject).units.length;
            setNewChapterTitles(Array(unitsLength).fill(""));
          } else {
            emptyData.title =
              apClasses.find(
                (apClass) =>
                  apClass
                    .replace(/AP /g, "")
                    .toLowerCase()
                    .replace(/[^a-z1-9 ]+/g, "")
                    .replace(/\s/g, "-") === params.slug,
              ) ?? "";
            setSubject(emptyData);
            // Initialize newChapterTitles with empty strings for each unit in emptyData
            const unitsLength = emptyData.units.length;
            setNewChapterTitles(Array(unitsLength).fill(""));
          }
        }
      } catch (error) {
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    })().catch((error) => {
      console.error("Error fetching questions:", error);
    });
  }, [user, params.slug, setError, setLoading]);

  const addUnit = () => {
    if (!newUnitTitle.trim() || !subject) return;
    const newUnit = {
      unit: subject.units.length + 1,
      title: newUnitTitle,
      chapters: [
        {
          chapter: 1,
          title: "",
        },
      ],
      test: {
        questions: [],
        time: 0,
        optedIn: false,
        instanceId: "",
      },
    };
    setSubject({ ...subject, units: [...subject.units, newUnit] });
    setNewUnitTitle("");
    // Add a new entry for the new unit in newChapterTitles
    setNewChapterTitles((prev) => [...prev, ""]);
    setUnsavedChanges(true);
  };
  const handleSave = async () => {
    try {
      await setDoc(doc(db, "subjects", params.slug), subject);
      alert("Subject units and chapters saved.");
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  return (
    <>
      {unsavedChanges && <Blocker />}

      <div className="relative min-h-screen">
        <main className="container max-w-3xl flex-grow px-4 pb-8 pt-20 md:px-10 lg:px-14 2xl:px-20">
          <div className="flex justify-between">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin"
            >
              <ArrowLeft className="mr-2" />
              Return to Admin Dashboard
            </Link>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSave}
            >
              <Save className="mr-2" /> Save Changes
            </Button>
          </div>
          <h1 className="mt-8 text-4xl font-bold">{subject?.title}</h1>
          <div className="my-4 space-y-4">
            {subject?.units.map((unit, unitIndex) => (
              // This doesnt actually increase efficency; just for abstraction.
              <UnitDisplay
                unit={unit}
                unitIndex={unitIndex}
                subject={subject}
                params={params}
                newChapterTitles={newChapterTitles}
                setNewChapterTitles={setNewChapterTitles}
                setSubject={setSubject}
                setUnsavedChanges={setUnsavedChanges}
              />
            ))}
          </div>
          <div className="mb-4 flex items-center">
            <input
              className="mr-2 rounded border p-2"
              value={newUnitTitle}
              onChange={(e) => setNewUnitTitle(e.target.value)}
              placeholder="New unit title"
            />
            <Button
              onClick={addUnit}
              className="cursor-pointer bg-green-500 hover:bg-green-600"
            >
              <PlusCircle className="mr-2" /> Add Unit
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default Page;
