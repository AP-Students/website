"use client";

import TestRenderer from "@/app/questions/testRenderer";
import QuestionsInputInterface from "@/app/article-creator/_components/custom_questions/QuestionsInputInterface";
import { useSyncedQuestions } from "@/app/article-creator/_components/custom_questions/QuestionInstance";
import Navbar from "@/components/ui/navbar";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { getUserAccess } from "@/components/hooks/users";
import { useEffect } from "react";
import { Subject } from "@/types";

const pathname = window.location.pathname;


const Page = () => {
  const { user } = useUser();
  const instanceId = pathname.split("/").slice(-2).join("_");
  const collectionId = instanceId.split("_")[0];
  const unitId = instanceId.split("_")[1];
  const { questions, setQuestions } = useSyncedQuestions(instanceId);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const userAccess = await getUserAccess();
        if (userAccess && (userAccess === "admin" || userAccess === "member")) {
          const docRef = doc(db, "subjects", collectionId!);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Subject;
            const unitIndex = parseInt(unitId!, 10) - 1;
            const questions = data && data.units[unitIndex] && data.units[unitIndex].test!.questions;
            if(questions){
              setQuestions(questions);
            }else{
              setQuestions(useSyncedQuestions(instanceId).questions);
            }
          }
        }
      } catch (error: any) {
        console.log("Error fetching subject data:", error.message);
      }
    };

    fetchQuestions();
  }, []);


  const handleSave = async () => {
    try {
      const unitIndex = parseInt(unitId!, 10) - 1; // Get the unit index from the path
      const subjectRef = doc(db, "subjects", collectionId!);

      // Retrieve the current document to get the existing units array
      const docSnap = await getDoc(subjectRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const units = data.units;

        const sanitizedQuestions = removeUndefined(questions);

        console.log("Questions", questions);
        console.log("Sanitized Questions", sanitizedQuestions);
        // Update the specific unit in the array
        units[unitIndex] = {
          ...units[unitIndex],
          test: {
            ...(units[unitIndex]?.test),
            optedIn: true,
            questions: sanitizedQuestions, 
          },
        };

        console.log("units[unitIndex]", units[unitIndex]);
        console.log("data", data);

        // Update the units array in Firestore
        await setDoc(
          doc(db, "subjects", collectionId!),
          { units },
          { merge: true }
        );
        alert("Questions saved successfully.");
      } else {
        console.error("Subject document does not exist!");
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      alert("Failed to save questions.");
    }
  };

  // User auth
  if (user && (user?.access === "admin" || user?.access === "member")) {
    return (
      <div className="relative min-h-screen">
        <Navbar />

        <div className="my-6 flex items-center justify-center">
          <Button className="bg-blue-600 text-white" onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        <div className="flex flex-row gap-4 p-4">
          <div
            className="flex-1 overflow-y-auto rounded border p-4"
            style={{ maxHeight: "100vh" }}
          >
            <QuestionsInputInterface
              questions={questions}
              setQuestions={setQuestions}
              testRenderer={true}
            />
          </div>
          <div className="flex-1 rounded border p-4">
            <TestRenderer inputQuestions={questions} adminMode={true} />
          </div>
        </div>
      </div>
    );
  } else if (user) {
    return <div>Failed to load data.</div>;
  }
};

export default Page;

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};
