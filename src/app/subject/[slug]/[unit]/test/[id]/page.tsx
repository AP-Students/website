"use client";

import TestRenderer from "@/components/questions/testRenderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { type UnitTest } from "@/types/firestore";
import { type QuestionFormat } from "@/types/questions";
import usePathname from "@/components/client/pathname";

const Page = () => {
  const pathname = usePathname();

  const basePath = pathname.split("/").slice(-4).join("_");
  const subject = basePath.split("_")[0]!;
  const unitId = basePath.split("_")[1]?.split("-").at(-1);
  const testId = basePath.split("_")[3]!;

  // const instanceId = [subject, unitId, "test", testId].join("_");

  const [time, setTime] = useState<number>(0);
  const [questions, setQuestions] = useState<QuestionFormat[] | null>(null);
  const [directions, setDirections] = useState("")

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const docRef = doc(
          db,
          "subjects",
          subject,
          "units",
          unitId!,
          "tests",
          testId,
        );

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UnitTest;

          const time = data.time;
          setTime((time && time / 60) ?? 20);
          setDirections(data.directions)

          const questionsData = data.questions;
          if (questionsData) {
            setQuestions(questionsData);
          } else {
            console.log("No questions found for this unit.");
          }
        } else {
          console.error("Subject document does not exist!");
        }
      } catch (error: unknown) {
        console.error("Error fetching subject data:", error);
      }
    };

    fetchQuestions().catch((error) => {
      console.error("Error fetching subject data:", error);
    });
  }, [subject, unitId, testId]);

  // Render TestRenderer only for clients without admin privileges

  if (questions === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-8 py-12">
      <TestRenderer time={time} inputQuestions={questions} adminMode={false} directions={directions}/>
    </div>
  );
};

export default Page;
