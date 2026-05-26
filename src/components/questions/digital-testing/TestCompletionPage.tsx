"use client";

import { useState } from "react";
import Image from "next/image";
import ConfettiExplosion from "react-confetti-explosion";
import type { QuestionFormat } from "@/types/questions";
import { isQuestionCorrect } from "./ReviewPage";

interface TestCompletionPageProps {
  onContinue: () => void;
  testName: string;
  score: number;
  totalQuestions: number;
  username?: string;
  artSrc?: string;
  questions: QuestionFormat[];
  selectedAnswers: Record<number, string[]>;
}

const completionMessages = [
  "Great work, {username}! You are the GOAT.",
  "Excellent Performance, {username}.",
  "Practice complete, {username}. It seems like you're starting to get the hang of this!",
  "Nicely done, {username}. Another MCQ set defeated straight into the ground.",
  "That was a clean finish on your end, {username}.",
  "No one can match your unreal talent, {username}!",
  "I can't believe how good you are at this, {username}. Are you sure you're not an AI?",
  "With this treasure I summon...A Perfect SCORE!! You absolutely exorcised this set.",
  "SSSadistic , {username}! Absolutley shocked the proctors.",
];

export default function TestCompletionPage({
  onContinue,
  testName,
  score,
  totalQuestions,
  username,
  questions,
  selectedAnswers,
  artSrc = "/mcq-completion-art.svg",
}: TestCompletionPageProps) {
  const [randomMessage] = useState(() => {
    const selected =
      completionMessages[Math.floor(Math.random() * completionMessages.length)] ??
      completionMessages[0] ??
      "Great work, {username}!";
    const displayName = username?.trim() || "there";
    return selected
      .replaceAll("{username}", displayName)
      .replaceAll("[UserName]", displayName);
  });

  return (
    <section className="relative flex min-h-[calc(100vh-150px)] w-full items-center justify-center overflow-hidden bg-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(248,250,252,0.9),rgba(255,255,255,0.98))]" />

      <div className="pointer-events-none absolute -left-10 top-0 opacity-70 sm:left-8 sm:top-2">
        <ConfettiExplosion
          duration={3200}
          force={0.7}
          particleCount={120}
          width={1200}
          zIndex={5}
        />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 opacity-70">
        <ConfettiExplosion
          duration={3400}
          force={0.75}
          particleCount={130}
          width={1300}
          zIndex={5}
        />
      </div>
      <div className="pointer-events-none absolute -right-10 top-2 opacity-70 sm:right-8 sm:top-4">
        <ConfettiExplosion
          duration={3200}
          force={0.7}
          particleCount={120}
          width={1200}
          zIndex={5}
        />
      </div>
      <div className="pointer-events-none absolute bottom-8 left-10 hidden opacity-60 sm:block">
        <ConfettiExplosion
          duration={3000}
          force={0.65}
          particleCount={90}
          width={1000}
          zIndex={5}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-[1280px] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:min-h-[720px] lg:flex-row">
        <div className="flex flex-1 flex-col justify-between bg-[#fff2dc] px-6 py-6 text-slate-900 sm:px-10 sm:py-8 lg:px-12 lg:py-10">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c97a16]">
                FiveHive AP Practice
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Nice work.
              </h2>
            </div>

            <p className="max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
              {randomMessage}
            </p>
          </div>

          <div className="mt-8 flex flex-1 items-end justify-start">
            <Image
              src={artSrc}
              alt="Celebration artwork"
              width={420}
              height={300}
              className="h-auto w-full max-w-[460px] object-contain sm:max-w-[520px] lg:max-w-[580px]"
              priority
            />
          </div>
        </div>

        <div className="flex w-full max-w-[560px] flex-col border-t border-slate-200 bg-white sm:border-t-0 lg:border-l">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#b7791f]">
              Your Score
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black leading-none text-slate-900 sm:text-6xl">
                {score}
              </span>
              <span className="pb-1 text-2xl font-semibold text-[#b7791f]">
                /
              </span>
              <span className="text-3xl font-semibold leading-none text-slate-500 sm:text-4xl">
                {totalQuestions}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Review the questions below to see what you got right and wrong.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {testName || "Practice Test"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-3">
              {questions.map((question, index) => {
                const correct = isQuestionCorrect(
                  question,
                  selectedAnswers[index] ?? [],
                );

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                          Question {index + 1}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-800">
                          {question.question.value}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          correct
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {correct ? "Right" : "Wrong"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 p-6 sm:p-8">
            <button
              className="w-full rounded-full bg-[#173a7a] px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-[#132f63]"
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
