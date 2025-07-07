"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  collection,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { useUser } from "@/components/hooks/UserContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import { clearUserCache } from "@/components/hooks/users";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const FRQSubmissionPage = () => {
  const { user } = useUser();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const [FRQYear, setFRQYear] = useState<number | null>(null);
  const [FRQSubject, setFRQSubject] = useState<string>("");
  const [FRQQuestionType, setFRQQuestionType] = useState<string>("");
  const [FRQQuestionNumber, setFRQQuestionNumber] = useState<number | null>(
    null,
  );

  // Set cooldown from user data
  useEffect(() => {
    if (user?.lastFrqResponseAt?.seconds) {
      const end = user.lastFrqResponseAt.seconds * 1000 + COOLDOWN_MS;
      if (Date.now() < end) setCooldownEnd(end);
    }
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (!cooldownEnd) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = cooldownEnd - now;
      if (diff <= 0) {
        setCooldownEnd(null);
        clearUserCache(); // Refresh user data
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleSubmit = async () => {
    if (!user || !response.trim()) {
      setMessage("Please write a response and ensure you are logged in.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Reference to user's FRQ responses subcollection
      const userRef = doc(db, "users", user.uid);
      const frqResponseRef = doc(collection(userRef, "frqResponses"));

      const batch = writeBatch(db);
      batch.set(frqResponseRef, {
        responseText: response,
        question: {
          id:
            "AP_" +
            FRQYear +
            "_" +
            FRQSubject +
            "_" +
            FRQQuestionType +
            "_" +
            FRQQuestionNumber,
        },
        userId: user.uid,
        submittedAt: serverTimestamp(),
      });

      batch.update(userRef, {
        lastFrqResponseAt: serverTimestamp(),
      });

      await batch.commit();

      clearUserCache();
      setCooldownEnd(Date.now() + COOLDOWN_MS); // Start new cooldown

      setMessage("Response submitted successfully!");
      setResponse("");
    } catch (error) {
      console.error("Error submitting response:", error);
      setMessage("Error submitting response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Submit an FRQ Response</h2>
      <p>
        While we work on FiveHive's practice free response questions, you may
        submit responses to{" "}
        <a
          href="https://apcentral.collegeboard.org/courses/past-exam-questions"
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          official AP FRQs from AP Central
        </a>{" "}
        and our team will grade them and give feedback. All graders received a 5
        on the exams that they are grading or an A/A+ in an equivalent college
        course. You will receive a response as soon as possible (usually 12-48
        hours) giving you a detailed score and explanation as to why you earned
        that score and how you may be able to improve. Check{" "}
        <Link
          href="/peer-grading/history"
          className="text-blue-500 hover:underline"
        >
          your report
        </Link>{" "}
        to see your scores and feedback.
      </p>
      {!!user ? (
        !cooldownEnd ? (
          <>
            <QuestionSelector
              setFRQYear={setFRQYear}
              setFRQSubject={setFRQSubject}
              setFRQQuestionType={setFRQQuestionType}
              setFRQQuestionNumber={setFRQQuestionNumber}
            />
            <p className="mb-2 rounded-md border border-orange-300 bg-orange-50 px-2 py-1">
              This text box does NOT currently save your response! It's
              recommended to write your response in a Google Doc or other text
              document and copy/paste it here.
            </p>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response here..."
              rows={10}
              className={cn(
                "mb-4 transition-colors",
                matcher.hasMatch(response) &&
                  "border border-red-300 bg-red-200",
              )}
            />
            {matcher.hasMatch(response) && (
              <div className="flex gap-2">
                <ShieldAlert className="size-12 shrink-0" />
                <p>
                  Profanities were detected in your response. You can still
                  submit your response, but your account may be flagged by
                  moderators.
                </p>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={
                !FRQYear ||
                FRQSubject === "" ||
                FRQQuestionType === "" ||
                !FRQQuestionNumber ||
                response.trim() === "" ||
                loading ||
                (user?.lastFrqResponseAt &&
                  Date.now() - user.lastFrqResponseAt.seconds <
                    8 * 60 * 60 * 1000)
              }
            >
              {loading ? "Submitting..." : "Submit Response"}
            </Button>
            {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
          </>
        ) : (
          <div className="mx-auto max-w-md p-8 text-center">
            <h2 className="mb-4 text-xl font-semibold">Submission Cooldown</h2>
            <p>You’ve recently submitted an FRQ. You can submit again in:</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{timeLeft}</p>
          </div>
        )
      ) : (
        <p className="mt-4 rounded-md border p-2">
          You must be logged in to submit an FRQ.
        </p>
      )}
    </div>
  );
};

export default FRQSubmissionPage;

import apClassesData from "@/components/apClasses.json";
import Link from "next/link";
const apClasses = apClassesData.apClasses;
function QuestionSelector({
  setFRQYear,
  setFRQSubject,
  setFRQQuestionType,
  setFRQQuestionNumber,
}: {
  setFRQYear: (year: number | null) => void;
  setFRQSubject: (subject: string) => void;
  setFRQQuestionType: (questionType: string) => void;
  setFRQQuestionNumber: (questionNumber: number | null) => void;
}) {
  const years = Array.from(
    { length: 9 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <div className="grid gap-2 py-4">
      <p className="rounded-md border border-yellow-300 bg-yellow-50 px-2 py-1">
        Only past exam questions from 2017 or later will be processed due to
        changes in AP format. We want to prioritize the questions that remain
        relevant to current AP standards.
      </p>
      <h3 className="font-bold">Select Your Question</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Year</span>
          <select
            className="rounded border px-3 py-2"
            onChange={(e) => setFRQYear(parseInt(e.target.value))}
          >
            <option value="">-- Select Year --</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Subject</span>
          <select
            className="rounded border px-3 py-2"
            onChange={(e) => setFRQSubject(e.target.value)}
          >
            <option value="">-- Select Subject --</option>
            {apClasses.map((apClass) => (
              <option key={apClass} value={apClass}>
                {apClass}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Question Type</span>
          <select
            className="rounded border px-3 py-2"
            onChange={(e) => setFRQQuestionType(e.target.value)}
          >
            <option value="">-- Select Question Type --</option>
            <option value="frq">FRQ</option>
            <option value="saq">SAQ</option>
            <option value="dbq">DBQ</option>
            <option value="leq">LEQ</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Question Number</span>
          <select
            className="rounded border px-3 py-2"
            onChange={(e) => setFRQQuestionNumber(parseInt(e.target.value))}
          >
            <option value="">-- Select Question Number --</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </label>
      </div>
    </div>
  );
}
