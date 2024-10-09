"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Edit, Trash, PlusCircle } from 'lucide-react';
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import apClassesData from "@/app/admin/apClasses.json";
import { Subject } from "@/types";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

const apClasses = apClassesData.apClasses;
const pathname = window.location.pathname;

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
    },
  ],
};

const Page = ({ params }: { params: { slug: string } }) => {
  const { user, loading, error, setError, setLoading } = useUser();
  const [subject, setSubject] = useState<Subject>();
  const [expandedUnits, setExpandedUnits] = useState<number[]>([]);
  const [editingChapter, setEditingChapter] = useState<{
    unitIndex: number | null;
    chapterIndex: number | null;
  }>({ unitIndex: null, chapterIndex: null });
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const chapterInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSubject(docSnap.data() as Subject);
          } else {
            emptyData.title = apClasses.find(
              (apClass) =>
                apClass
                  .replace(/AP /g, "")
                  .toLowerCase()
                  .replace(/[^a-z1-9 ]+/g, "")
                  .replace(/\s/g, "-") === params.slug
            ) || "";
            setSubject(emptyData);
          }
        }
      } catch (error) {
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [user]);

  const addChapter = (unitIndex: number) => {
    if (!newChapterTitle.trim()) return;
    const newChapter = {
      chapter: subject!.units[unitIndex]!.chapters.length + 1 || 1,
      title: newChapterTitle,
    };
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.chapters.push(newChapter);
    setSubject({ ...subject!, units: updatedUnits });
    setNewChapterTitle("");
  };

  const editChapterTitle = (unitIndex: number, chapterIndex: number, newTitle: string) => {
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.chapters[chapterIndex]!.title = newTitle;
    setSubject({ ...subject!, units: updatedUnits });
    setEditingChapter({ unitIndex: null, chapterIndex: null });
  };

  const deleteChapter = (unitIndex: number, chapterIndex: number) => {
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.chapters.splice(chapterIndex, 1);
    setSubject({ ...subject!, units: updatedUnits });
  };

  const toggleUnit = (unitIndex: number) => {
    setExpandedUnits(prev => 
      prev.includes(unitIndex) 
        ? prev.filter(i => i !== unitIndex)
        : [...prev, unitIndex]
    )
  }

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "subjects", params.slug), subject);
      alert("Subject units and chapters saved.");
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-3xl">Loading...</div>
  }

  if (error || !subject) {
    return <div className="flex min-h-screen items-center justify-center text-3xl">{error}</div>
  }

  function optInForUnitTest(unitIndex: number): void {
    throw new Error("Function not implemented.");
  }

  return (
    <>
    <div className="relative min-h-screen">
      <Navbar />

      <main className="container flex-grow px-4 md:px-10 lg:px-14 2xl:px-20 py-8">
        <h1 className="mb-8 text-center text-4xl font-bold">{subject?.title}</h1>
        <div className="mb-8 space-y-4">
          {subject?.units.map((unit, unitIndex) => (
            <div key={unit.unit} className="rounded-lg border bg-white shadow-sm">
              <button
                className="flex w-full items-center justify-between p-4 text-lg font-semibold"
                onClick={() =>
                  setExpandedUnits((prev) =>
                    prev.includes(unitIndex)
                      ? prev.filter((i) => i !== unitIndex)
                      : [...prev, unitIndex]
                  )
                }
              >
                <span>Unit {unit.unit}: {unit.title}</span>
                {expandedUnits.includes(unitIndex) ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedUnits.includes(unitIndex) && (
                <div className="border-t p-4">
                  {unit.chapters.map((chapter, chapterIndex) => (
                    <div key={chapter.chapter} className="flex justify-between items-center mb-3">
                      {editingChapter.unitIndex === unitIndex && editingChapter.chapterIndex === chapterIndex ? (
                        <input
                          defaultValue={chapter.title}
                          ref={chapterInputRef}
                          onBlur={(e) => editChapterTitle(unitIndex, chapterIndex, e.target.value)}
                        />
                      ) : (
                        <Link href={`#`}>Chapter {chapter.chapter}: {chapter.title}</Link>
                      )}
                      <div className="flex gap-2">
                        <Edit onClick={() => setEditingChapter({ unitIndex, chapterIndex })} className="cursor-pointer hover:text-blue-400 " />
                        <Trash onClick={() => deleteChapter(unitIndex, chapterIndex)} className="cursor-pointer hover:text-primary" />
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center">
                    <input
                      className="border p-2 rounded mr-2"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="New chapter title"
                    />
                    <Button onClick={() => addChapter(unitIndex)} className="cursor-pointer bg-green-500 hover:bg-green-600">  
                      <PlusCircle className="mr-2" /> Add Chapter
                    </Button>
                  </div>

                  <Button 
                    className="mt-4" 
                    onClick={() => optInForUnitTest(unitIndex)}
                  >
                    Opt in for Unit Test
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button className="bg-blue-600 text-white" onClick={handleSave}>
          Save Changes
        </Button>
      </main>

      
    </div>
    <Footer />
    </>
  );
};

export default Page;