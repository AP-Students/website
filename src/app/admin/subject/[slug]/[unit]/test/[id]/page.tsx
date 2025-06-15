"use client";

import TestRenderer from "@/components/questions/testRenderer";
import QuestionsInputInterface from "@/components/article-creator/custom_questions/QuestionsInputInterface";
import { syncedQuestions } from "@/components/article-creator/custom_questions/QuestionInstance";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { UnitTest } from "@/types/firestore";
import { usePathname } from "next/navigation";
import type { QuestionFormat } from "@/types/questions";
import { processQuestions } from "@/components/article-creator/FetchArticleFunctions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/app/admin/subject/link";
import { ArrowLeft, UserRoundCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { Blocker } from "@/app/admin/subject/navigation-block";

const Page = () => {
  const pathname = usePathname();

  const { user } = useUser();
  const instanceId = pathname.split("/").slice(-4).join("_");
  const subject = instanceId.split("_")[0]!;
  const unitId = instanceId.split("_")[1]!;
  const testId = instanceId.split("_")[3]!;

  const [minutes, setMinutes] = useState<number>(22);
  const [seconds, setSeconds] = useState<number>(40);
  const { questions, setQuestions } = syncedQuestions(instanceId);
  const [directions, setDirections] = useState("");
  const [testName, setTestName] = useState<string>("");

  const [testLoading, setTestLoading] = useState<boolean>(true);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

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
        setMinutes((time && Math.floor(time / 60)) ?? 20);
        setSeconds((time && time % 60) ?? 40);
        const questions = data.questions;

        setDirections(
          data.directions
            ? data.directions
            : "Read each passage and question carefully, and then choose the best answer to the question based on the passage(s). All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
        );

        setTestName(data.name ?? "");
        if (questions) {
          setQuestions(questions);
        } else {
          setQuestions(syncedQuestions(instanceId).questions);
        }
        setTestLoading(false);
      }
    })().catch((error) => {
      console.error("Error fetching questions:", error);
    });
  }, [subject, unitId, instanceId, setQuestions, user, testId]);

  const handleSave = async () => {
    // Find a way to save to storage
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
      const processedQuestions = await processQuestions(sanitizedQuestions);

      const testData = {
        questions: processedQuestions,
        time: minutes * 60 + seconds,
        instanceId: instanceId ?? "",
        directions,
      };

      await setDoc(testRef, testData, { merge: true });
      alert("Test saved successfully.");
      setUnsavedChanges(false);
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
        {unsavedChanges && <Blocker />}
        <div className="grid gap-2 pl-4 pt-6">
          <Link
            className={cn(
              buttonVariants({
                variant: unsavedChanges ? "destructive" : "outline",
              }),
              "w-min",
            )}
            href={`/admin`}
          >
            <UserRoundCog className="mr-2" />
            Return to Admin Dashboard
          </Link>
          <Link
            className={cn(
              buttonVariants({
                variant: unsavedChanges ? "destructive" : "outline",
              }),
              "w-min",
            )}
            href={`/admin/subject/${subject}`}
          >
            <ArrowLeft className="mr-2" />
            Return to Subject
          </Link>
        </div>
        <div className="flex gap-2 p-4 pb-0">
          <div className="grid place-content-start gap-1.5">
            <Label htmlFor="minutes">Minutes</Label>
            <Input
              type="number"
              id="minutes"
              placeholder="22"
              min={0}
              value={minutes}
              className="w-24"
              onChange={(e) => {
                setMinutes(parseInt(e.target.value) || 0);
                setUnsavedChanges(true);
              }}
            />
          </div>
          <div className="grid place-content-start gap-1.5">
            <Label htmlFor="seconds">Seconds</Label>
            <Input
              type="number"
              id="seconds"
              placeholder="40"
              min={0}
              value={seconds}
              className="w-24"
              onChange={(e) => {
                setSeconds(parseInt(e.target.value) || 0);
                setUnsavedChanges(true);
              }}
            />
          </div>
          <div className="grid grow gap-1.5">
            <Label htmlFor="directions">Directions</Label>
            <Textarea
              id="directions"
              value={directions}
              onChange={(e) => {
                setDirections(e.target.value);
                setUnsavedChanges(true);
              }}
            />
          </div>
          {(!testLoading || unsavedChanges) && (
            <Button
              className={cn(
                "mt-5 bg-blue-600 hover:bg-blue-700",
                unsavedChanges && "animate-pulse",
              )}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          )}
        </div>

        <div className="flex max-h-[calc(100vh-274px)] flex-row gap-4 p-4">
          <div className="flex-1 overflow-y-auto rounded border p-4">
            <QuestionsInputInterface
              questions={questions}
              setQuestions={setQuestions}
              testRenderer={true}
              setUnsavedChanges={setUnsavedChanges}
            />
          </div>
          <div className="flex-1 overflow-y-scroll rounded border p-4">
            <TestRenderer
              time={minutes * 60 + seconds}
              inputQuestions={questions}
              adminMode={true}
              testName={testName}
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
