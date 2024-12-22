"use client";

import TestRenderer from "@/components/questions/testRenderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { type Subject } from "@/types";
import { QuestionInput, type QuestionFormat, type Option } from "@/types/questions";
import usePathname from "@/components/client/pathname";
import { notFound } from "next/navigation";

const Page = () => {
  const [testName, setTestName] = useState<string>("AP Music Theory Unit 1 Test");
  const [time, setTime] = useState<number>(0);

  const questions: QuestionFormat[] = [
    {
      question: {
        value: "This is the value"
      } as QuestionInput,
      type: "mcq",
      options: [
        {
          
        } as Option
      ]
    } as QuestionFormat
  ]

  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col items-center justify-center p-8">
        <div className="p-4 w-full">
          <TestRenderer
            time={time}
            testName={testName}
            inputQuestions={questions}
            adminMode={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
