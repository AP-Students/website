"use client";

import TestRenderer from "@/components/questions/testRenderer";
import { subject } from "@/lib/subject";
import type { QuestionFormat } from "@/types/questions";

const Page = () => {
  const testName= "AP Music Theory Unit 1 Test";
  const time = subject.units[0]!.test!.time;

  const questions: QuestionFormat[] = [];

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
