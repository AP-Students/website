"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { Check, X } from "lucide-react";
import { db } from "@/lib/firebase";
import usePathname from "@/components/client/pathname";
import { useUser } from "@/components/hooks/UserContext";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAuthHref } from "@/lib/redirect";
import { dashboardDocumentPaths } from "@/types/dashboard";
import type { QuestionFormat, QuestionInput } from "@/types/questions";
import {
  reviewAttempt,
  testAttemptKey,
  type ReviewItem,
} from "@/lib/testReview";
import "katex/dist/katex.min.css";

interface Attempt {
  label?: string;
  answers?: unknown;
  fingerprints?: unknown;
  score?: { correct?: number; total?: number };
  submittedAt?: Timestamp;
}

type State =
  | { status: "loading" }
  | { status: "no-attempt" }
  | { status: "error"; message: string }
  | { status: "ready"; attempt: Attempt; questions: QuestionFormat[] };

const hasContent = (input: QuestionInput | undefined) =>
  !!input && (input.value.trim() !== "" || input.files.length > 0);

/** Your latest graded attempt at a unit test: answers, score and explanations. */
export default function TestReviewPage() {
  const pathname = usePathname() ?? "";
  const { user, loading } = useUser();
  const [state, setState] = useState<State>({ status: "loading" });

  // /subject/{slug}/unit-{n}-{unitId}/test/{testId}/review
  const { subject, unitId, testId, testHref } = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const at = parts.lastIndexOf("review");
    return {
      subject: parts[at - 4] ?? "",
      unitId: parts[at - 3]?.split("-").at(-1) ?? "",
      testId: parts[at - 1] ?? "",
      testHref: "/" + parts.slice(0, at).join("/"),
    };
  }, [pathname]);

  useEffect(() => {
    if (loading || !user || !subject || !unitId || !testId) return;
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      const attempt = await getDoc(
        doc(
          db,
          dashboardDocumentPaths.testAttempt(
            user.uid,
            testAttemptKey({ subject, unitId, testId }),
          ),
        ),
      );
      if (!attempt.exists()) {
        if (!cancelled) setState({ status: "no-attempt" });
        return;
      }
      const test = await getDoc(
        doc(db, "subjects", subject, "units", unitId, "tests", testId),
      );
      const questions = test.data()?.questions as QuestionFormat[] | undefined;
      if (cancelled) return;
      setState(
        Array.isArray(questions)
          ? {
              status: "ready",
              attempt: attempt.data() as Attempt,
              questions,
            }
          : { status: "error", message: "This test isn't available anymore." },
      );
    })().catch((error) => {
      console.error("Error loading the test review:", error);
      if (!cancelled)
        setState({
          status: "error",
          message: "We couldn't load your answers. Please try again.",
        });
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, subject, unitId, testId]);

  if (!loading && !user) {
    return (
      <Message>
        <p>Log in to review your answers.</p>
        <Link
          href={getAuthHref("/login", pathname)}
          className={cn(buttonVariants(), "rounded-full")}
        >
          Log in
        </Link>
      </Message>
    );
  }

  if (loading || state.status === "loading") {
    return <Message>Loading your answers...</Message>;
  }

  if (state.status === "no-attempt") {
    return (
      <Message>
        <p>
          There are no saved answers for this test yet. Answers are saved each
          time you finish a test, so take it again to review it here.
        </p>
        <Link href={testHref} className={cn(buttonVariants(), "rounded-full")}>
          Take the test
        </Link>
      </Message>
    );
  }

  if (state.status === "error") {
    return <Message>{state.message}</Message>;
  }

  const { attempt, questions } = state;
  const items = reviewAttempt(questions, attempt);
  const submitted = attempt.submittedAt?.toDate?.();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{attempt.label ?? "Unit Test"}</h1>
      <p className="mt-2 text-lg">
        You got{" "}
        <strong>
          {attempt.score?.correct ?? 0} of {attempt.score?.total ?? 0}
        </strong>{" "}
        right
        {submitted && (
          <span className="text-gray-600">
            {" "}
            on{" "}
            {submitted.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
        .
      </p>
      <p className="mt-1 text-sm text-gray-600">This is your latest attempt.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={testHref} className={cn(buttonVariants(), "rounded-full")}>
          Retake test
        </Link>
        <Link
          href="/dashboard#history"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          Back to history
        </Link>
      </div>

      <ol className="mt-8 grid gap-6">
        {items.map((item) => (
          <ReviewQuestion
            key={item.index}
            item={item}
            question={questions[item.index]!}
          />
        ))}
      </ol>
    </main>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      {children}
    </main>
  );
}

function ReviewQuestion({
  item,
  question,
}: {
  item: ReviewItem;
  question: QuestionFormat;
}) {
  const verdict = !item.gradable
    ? { text: "Not graded", className: "bg-gray-100 text-gray-700" }
    : item.changed
      ? { text: "Changed", className: "bg-yellow-100 text-yellow-800" }
      : item.correct
        ? { text: "Correct", className: "bg-green-100 text-green-800" }
        : item.chosen.length
          ? { text: "Incorrect", className: "bg-red-100 text-red-800" }
          : { text: "Skipped", className: "bg-red-100 text-red-800" };

  return (
    <li
      className="rounded-lg border p-4"
      aria-labelledby={`question-${item.index}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id={`question-${item.index}`}
          className="bg-black px-3 py-0.5 text-lg font-bold text-white"
        >
          <span className="sr-only">Question </span>
          {item.index + 1}
        </h2>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-sm font-semibold",
            verdict.className,
          )}
        >
          {verdict.text}
        </span>
        {question.topic && (
          <span className="ml-auto text-sm text-gray-600">
            Topic: {question.topic}
          </span>
        )}
      </div>

      {item.changed && item.gradable && (
        <p className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm">
          This question was edited after you took the test, so your answer
          isn&apos;t shown.
        </p>
      )}

      {hasContent(question.content) && (
        <div className="mt-3 rounded-md bg-gray-50 p-3">
          <RenderContent content={question.content} origin="content" />
        </div>
      )}
      <div className="mt-3 text-lg">
        <RenderContent content={question.question} origin="question" />
      </div>

      {question.type !== "frq" && (
        <ul className="mt-3 grid gap-2">
          {question.options.map((option, index) => {
            const chosen = item.chosen.includes(option.id);
            const right = item.correctIds.includes(option.id);
            return (
              <li
                key={option.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 p-2",
                  chosen && right && "border-green-500 bg-green-100",
                  chosen && !right && "border-red-500 bg-red-100",
                  !chosen && "border-gray-300",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-black",
                    chosen && "bg-[#3075c1] text-white",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0 flex-1">
                  <RenderContent content={option.value} origin="option" />
                </span>
                {chosen && (
                  <span className="text-sm font-semibold">Your answer</span>
                )}
                {right && (
                  <Check
                    className="shrink-0 stroke-green-600 stroke-[3px]"
                    role="img"
                    aria-label="Correct answer"
                  />
                )}
                {chosen && !right && (
                  <X
                    className="shrink-0 stroke-red-600 stroke-[3px]"
                    role="img"
                    aria-label="Wrong answer"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasContent(question.explanation) && (
        <div className="mt-3 rounded-lg bg-gray-100 p-3">
          <h3 className="mb-1 font-semibold">Explanation</h3>
          <RenderContent content={question.explanation} origin="explanation" />
        </div>
      )}
    </li>
  );
}
