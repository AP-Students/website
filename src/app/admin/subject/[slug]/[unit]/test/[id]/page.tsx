"use client";

import TestRenderer from "@/components/questions/testRenderer";
import QuestionsInputInterface from "@/components/article-creator/custom_questions/QuestionsInputInterface";
import { syncedQuestions } from "@/components/article-creator/custom_questions/QuestionInstance";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import type { ReferenceSheet, Subject, UnitTest } from "@/types/firestore";
import { usePathname } from "next/navigation";
import type { QuestionFormat } from "@/types/questions";
import { processQuestions } from "@/components/article-creator/FetchArticleFunctions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminEditorBackLinks } from "@/app/admin/subject/link";
import { Blocker } from "@/app/admin/subject/navigation-block";
import { AutosaveStatus } from "@/app/admin/subject/autosave-status";
import { useAutosave } from "@/components/hooks/useAutosave";
import {
  CALCULATOR_TYPE_LABELS,
  type CalculatorPermission,
  type CalculatorType,
} from "@/lib/calculator";
import ReferenceSheetPanel from "@/components/questions/ReferenceSheetPanel";

const Page = () => {
  const pathname = usePathname() ?? "";

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
  const [calculatorDefault, setCalculatorDefault] =
    useState<CalculatorPermission>("inherit");
  const [calculatorCourseDefault, setCalculatorCourseDefault] =
    useState<CalculatorPermission>();
  const [calculatorType, setCalculatorType] =
    useState<CalculatorType>("graphing");
  const [subjectReferenceSheets, setSubjectReferenceSheets] = useState<
    ReferenceSheet[]
  >([]);
  const [referenceSheetEnabled, setReferenceSheetEnabled] =
    useState<boolean>(false);
  const [referenceSheetId, setReferenceSheetId] = useState<string>("");
  const [showReferenceSheetPreview, setShowReferenceSheetPreview] =
    useState<boolean>(false);

  const [testLoading, setTestLoading] = useState<boolean>(true);

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
        let data = docSnap.data() as Partial<UnitTest> | undefined;

        if (!data) {
          const testData = {
            questions: [],
            time: 30 * 60,
            instanceId: instanceId ?? "",
          };

          await setDoc(docRef, testData, { merge: true });

          // `docSnap` predates this write and is still empty. Reading it threw,
          // so a new test never finished loading and could not autosave.
          data = testData;
        }

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
        setCalculatorDefault(data.calculatorDefault ?? "inherit");
        setCalculatorType(data.calculatorType ?? "graphing");
        // Without stored questions, keep the ones `syncedQuestions` already
        // restored. Calling that hook again here, outside render, threw and
        // left a new test stuck loading.
        if (questions) {
          setQuestions(questions);
        }

        const subjectSnap = await getDoc(doc(db, "subjects", subject));
        const subjectData = subjectSnap.exists()
          ? (subjectSnap.data() as Subject)
          : null;
        setCalculatorCourseDefault(subjectData?.calculatorDefault);
        const availableSheets = subjectData?.referenceSheets ?? [];

        setSubjectReferenceSheets(availableSheets);
        setReferenceSheetEnabled(data.referenceSheetEnabled ?? false);
        setReferenceSheetId(
          data.referenceSheetId ?? availableSheets[0]?.id ?? "",
        );

        setTestLoading(false);
      }
    })().catch((error) => {
      console.error("Error fetching questions:", error);
    });
  }, [subject, unitId, instanceId, setQuestions, user, testId]);

  const draft = useMemo(
    () => ({
      questions,
      minutes,
      seconds,
      directions,
      calculatorDefault,
      calculatorType,
      referenceSheetEnabled,
      referenceSheetId,
    }),
    [
      questions,
      minutes,
      seconds,
      directions,
      calculatorDefault,
      calculatorType,
      referenceSheetEnabled,
      referenceSheetId,
    ],
  );

  // Writes the draft it is handed, and throws so the autosave status can
  // report a failure instead of an alert popping up mid-edit.
  const saveTest = async (testDraft: typeof draft) => {
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

      const sanitizedQuestions = removeUndefined(
        testDraft.questions,
      ) as QuestionFormat[];
      const processedQuestions = await processQuestions(sanitizedQuestions);

      const testData = {
        questions: processedQuestions,
        time: testDraft.minutes * 60 + testDraft.seconds,
        instanceId: instanceId ?? "",
        directions: testDraft.directions,
        calculatorDefault: testDraft.calculatorDefault,
        calculatorType: testDraft.calculatorType,
        referenceSheetEnabled: testDraft.referenceSheetEnabled,
        referenceSheetId: testDraft.referenceSheetEnabled
          ? testDraft.referenceSheetId
          : "",
      };

      await setDoc(testRef, testData, { merge: true });
    } catch (error) {
      console.error("Error saving questions:", error);
      throw error;
    }
  };

  const autosave = useAutosave({
    value: draft,
    save: saveTest,
    enabled: !testLoading,
  });

  // User auth
  if (
    user &&
    (user?.access === "admin" || user?.access === "member") &&
    questions
  ) {
    return (
      <div className="relative min-h-screen">
        {autosave.hasUnsavedChanges && <Blocker onLeave={autosave.flush} />}
        <div className="pl-4 pt-6">
          <AdminEditorBackLinks
            subjectSlug={subject}
            unsavedChanges={autosave.hasUnsavedChanges}
          />
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
              }}
            />
          </div>
          <div className="grid place-content-start gap-1.5">
            <Label htmlFor="calculatorDefault">Default Calculator</Label>
            <select
              id="calculatorDefault"
              className="rounded border p-1.5 text-sm"
              value={calculatorDefault}
              onChange={(e) => {
                setCalculatorDefault(e.target.value as CalculatorPermission);
              }}
            >
              <option value="inherit">Inherit from course</option>
              <option value="not-allowed">Not allowed</option>
              <option value="allowed">Allowed</option>
            </select>
          </div>
          {calculatorDefault === "allowed" && (
            <div className="grid place-content-start gap-1.5">
              <Label htmlFor="calculatorType">Calculator Type</Label>
              <select
                id="calculatorType"
                className="rounded border p-1.5 text-sm"
                value={calculatorType}
                onChange={(e) => {
                  setCalculatorType(e.target.value as CalculatorType);
                }}
              >
                {Object.entries(CALCULATOR_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}
          <div className="grid place-content-start gap-1.5">
            <Label
              htmlFor="referenceSheetEnabled"
              className="flex items-center gap-2"
            >
              <input
                type="checkbox"
                id="referenceSheetEnabled"
                checked={referenceSheetEnabled}
                onChange={(e) => {
                  setReferenceSheetEnabled(e.target.checked);
                }}
              />
              Enable Reference Sheet
            </Label>
            {referenceSheetEnabled && (
              <select
                className="rounded border p-1.5 text-sm"
                value={referenceSheetId}
                onChange={(e) => {
                  setReferenceSheetId(e.target.value);
                }}
              >
                <option value="" disabled>
                  Select a reference sheet...
                </option>
                {subjectReferenceSheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.title || "Untitled Reference Sheet"}
                  </option>
                ))}
              </select>
            )}
            {referenceSheetEnabled && referenceSheetId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReferenceSheetPreview(true)}
              >
                Preview
              </Button>
            )}
          </div>
          {!testLoading && (
            <div className="mt-5 grid place-content-start gap-1.5">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => void autosave.saveNow()}
                disabled={autosave.status === "saving"}
              >
                Save Changes
              </Button>
              {/* Wraps under the button rather than widening a control row
                  that is already crowded on narrow screens. */}
              <AutosaveStatus
                status={autosave.status}
                error={autosave.error}
                onRetry={() => void autosave.saveNow()}
                className="whitespace-normal"
              />
            </div>
          )}
        </div>

        <div className="flex max-h-[calc(100vh-274px)] flex-row gap-4 p-4">
          <div className="flex-1 overflow-y-auto rounded border p-4">
            <QuestionsInputInterface
              questions={questions}
              setQuestions={setQuestions}
              testRenderer={true}
            />
          </div>
          <div className="flex-1 overflow-y-scroll rounded border p-4">
            <TestRenderer
              time={minutes * 60 + seconds}
              inputQuestions={questions}
              adminMode={true}
              testName={testName}
              calculatorCourseDefault={calculatorCourseDefault}
              calculatorDefault={calculatorDefault}
              calculatorType={calculatorType}
            />
          </div>
        </div>

        {referenceSheetEnabled &&
          (() => {
            const selectedSheet = subjectReferenceSheets.find(
              (sheet) => sheet.id === referenceSheetId,
            );

            return selectedSheet ? (
              <ReferenceSheetPanel
                sheet={selectedSheet}
                open={showReferenceSheetPreview}
                onOpenChange={setShowReferenceSheetPreview}
              />
            ) : null;
          })()}
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
