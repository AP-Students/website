"use client";

import { ConfettiExplosion } from "react-confetti-explosion";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const congratulationsMessages = [
  "You did it!",
  "Test conquered!",
  "That was brilliant!",
  "Another win for the hive!",
  "You crushed it!",
];

export default function CompletionPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [message, setMessage] = useState(congratulationsMessages[0]);

  useEffect(() => {
    setMessage(
      congratulationsMessages[
        Math.floor(Math.random() * congratulationsMessages.length)
      ] ?? congratulationsMessages[0],
    );
  }, []);

  const handleContinue = () => {
    router.push(pathname.split("/").slice(0, 3).join("/"));
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] px-5 py-10 text-center">
      <ConfettiExplosion
        particleCount={180}
        duration={3000}
        force={0.8}
        width={1600}
        colors={["#294ad1", "#f7bb20", "#f05d5e", "#46b5a7", "#8b5cf6"]}
      />
      <section className="relative z-10 flex w-full max-w-2xl flex-col items-center rounded-2xl border border-[#d9deee] bg-white px-6 py-10 shadow-[0_16px_50px_rgba(35,57,120,0.12)] sm:px-12 sm:py-14">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#294ad1]">
          Practice test complete
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Congratulations!
        </h1>
        <p className="mt-3 text-xl font-medium text-slate-600 sm:text-2xl">
          {message}
        </p>
        <Image
          src="/congratulations.png"
          alt="Celebratory illustration"
          width={2156}
          height={1803}
          className="my-7 h-auto w-full max-w-sm object-contain sm:my-9 sm:max-w-md"
        />
        <button
          type="button"
          onClick={handleContinue}
          className="w-full max-w-xs rounded-full bg-[#294ad1] px-8 py-3 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#203da9] focus:outline-none focus:ring-4 focus:ring-[#294ad1]/30"
        >
          Continue
        </button>
      </section>
    </main>
  );
}
