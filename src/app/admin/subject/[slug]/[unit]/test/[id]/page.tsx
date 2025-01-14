"use client";

import TestRenderer from "@/components/questions/testRenderer";
import QuestionsInputInterface from "@/components/article-creator/custom_questions/QuestionsInputInterface";
import { syncedQuestions } from "@/components/article-creator/custom_questions/QuestionInstance";
import Navbar from "@/components/global/navbar";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { UnitTest } from "@/types/firestore";
import { usePathname } from "next/navigation";
import type { QuestionFormat } from "@/types/questions";

const Page = () => {
  const pathname = usePathname();

  const { user } = useUser();
  const instanceId = pathname.split("/").slice(-4).join("_");
  const subject = instanceId.split("_")[0]!;
  const unitId = instanceId.split("_")[1]!;
  const testId = instanceId.split("_")[3]!;

  const [time, setTime] = useState<number>(30);
  const { questions, setQuestions } = syncedQuestions(instanceId);

  useEffect(() => {
    // Fetch questions
    (async () => {
      if (user && (user.access === "admin" || user.access === "member")) {
        const docRef = doc(
          db,
          "subjects",
          subject,
          "units",
          unitId,
          "tests",
          testId,
        );

        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const testData = {
            questions: [],
            time: 30 * 60,
            instanceId: instanceId ?? "",
          };

          await setDoc(docRef, testData, { merge: true });
        }

        const data = docSnap.data() as UnitTest;

        const time = data.time;
        setTime((time && time / 60) ?? 20);
        const questions = data.questions;

        if (questions) {
          setQuestions(questions);
        } else {
          setQuestions(syncedQuestions(instanceId).questions);
        }
      }
    })().catch((error) => {
      console.error("Error fetching questions:", error);
    });
  }, [subject, unitId, instanceId, setQuestions, user, testId]);

  const handleSave = async () => {
    try {
      const testRef = doc(
        db,
        "subjects",
        subject,
        "units",
        unitId,
        "tests",
        testId,
      );

      const sanitizedQuestions = removeUndefined(questions) as QuestionFormat[];

      const testData = {
        questions: sanitizedQuestions,
        time: time * 60, // Convert minutes to seconds
        instanceId: instanceId ?? "",
      };

      await setDoc(testRef, testData, { merge: true });
      alert("Test saved successfully.");
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

        <div className="flex items-center gap-2 p-4">
          <p>Time Limit: {time} minutes</p>
          <input
            type="number"
            value={time}
            onChange={(e) => setTime(parseInt(e.target.value) || 0)}
            className="border px-2 py-1 text-lg"
            min="0"
          />
          <Button
            className="ml-auto bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
          >
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
