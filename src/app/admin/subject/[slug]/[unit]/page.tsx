"use client";

import TestRenderer from "@/components/questions/testRenderer";
import QuestionsInputInterface from "@/components/article-creator/custom_questions/QuestionsInputInterface";
import { syncedQuestions } from "@/components/article-creator/custom_questions/QuestionInstance";
import Navbar from "@/components/global/navbar";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { getUserAccess } from "@/components/hooks/users";
import { useEffect, useState } from "react";
import type { Subject, Unit } from "@/types";
import usePathname from "@/components/client/pathname";
import type { QuestionFormat } from "@/types/questions";

const Page = () => {
  const pathname = usePathname();

  const { user } = useUser();
  const instanceId = pathname.split("/").slice(-2).join("_");
  const collectionId = instanceId.split("_")[0];
  const unitId = instanceId.split("_")[1];

  const [testName, setTestName] = useState<string>("");
  const [time, setTime] = useState<number>(0);
  const { questions, setQuestions } = syncedQuestions(instanceId);

  useEffect(() => {
    // Fetch questions
    (async () => {
      const userAccess = await getUserAccess();
      console.log("userAccess", userAccess);
      if (userAccess && (userAccess === "admin" || userAccess === "member")) {
        const docRef = doc(db, "subjects", collectionId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Subject;
          const unitIndex = parseInt(unitId!, 10) - 1;

          const time = data?.units?.[unitIndex]?.test?.time;
          setTime((time && time / 60) ?? 20);
          const testName = data?.title;
          setTestName(testName);
          const questions = data?.units[unitIndex]?.test!.questions;

          if (questions) {
            setQuestions(questions);
          } else {
            setQuestions(syncedQuestions(instanceId).questions);
          }
        }
      }
    })().catch((error) => {
      console.error("Error fetching questions:", error);
    });
  },[collectionId, unitId, instanceId, setQuestions]);

  const handleSave = async () => {
    try {
      const unitIndex = parseInt(unitId!, 10) - 1; // Get the unit index from the path
      const subjectRef = doc(db, "subjects", collectionId!);

      // Retrieve the current document to get the existing units array
      const docSnap = await getDoc(subjectRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const units = data.units as Unit[];

        const sanitizedQuestions = removeUndefined(questions) as QuestionFormat[];

        // Update the specific unit in the array
        units[unitIndex] = {
          ...units[unitIndex]!,
          test: {
            ...units[unitIndex]?.test,
            optedIn: true,
            questions: sanitizedQuestions,
            time: time * 60, // Convert minutes to seconds
            instanceId: instanceId ?? "",
          },
        };

        // Update the units array in Firestore
        await setDoc(
          doc(db, "subjects", collectionId!),
          { units },
          { merge: true },
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
  if (
    user &&
    (user?.access === "admin" || user?.access === "member") &&
    questions
  ) {
    return (
      <div className="relative min-h-screen">
        <Navbar />

        <div className="my-6 flex flex-col items-center justify-center">
          <h1 className="mb-2 text-center text-4xl font-bold">{testName}</h1>
          {/* For convience, not re-rendering effficency */}
          <TimeInput time={time} setTime={setTime} />
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
            <TestRenderer
              time={time}
              testName={testName}
              inputQuestions={questions}
              adminMode={true}
            />
          </div>
        </div>
      </div>
    );
  } else if (user && questions) {
    return <div>Failed to load data.</div>;
  } else {
    return (
      <div className="flex items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }
};

export default Page;

function TimeInput({ time, setTime }: { time: number; setTime: (time: number) => void }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="rounded-sm bg-blue-600 px-2 py-1 text-white">
        Set Time: {time} minutes
      </div>
      <input
        type="number"
        value={time}
        onChange={(e) => setTime(parseInt(e.target.value) || 0)}
        placeholder="Set time in minutes"
        className="rounded border p-2 text-lg"
        min="0"
      />
    </div>
  );
}

// Recursive types are pain so Im just gonna do this

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefined(item));
  } else if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};
/* eslint-enable */

