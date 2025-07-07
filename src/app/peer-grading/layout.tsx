"use client";

import Footer from "@/components/global/footer";
import Navbar from "@/components/global/navbar";
import { useUser } from "@/components/hooks/UserContext";
import Link from "next/link";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useUser();

  return (
    <>
      <Navbar />

      <div className="mx-auto flex max-w-4xl place-content-center pt-8">
        <nav className="mt-4 grid h-min gap-2 rounded-lg border border-b border-gray-300 p-4 shadow-sm">
          <h2 className="w-48 font-bold">FiveHive Peer Grading</h2>
          <Link className="hover:underline" href="/peer-grading">
            Practice
          </Link>
          <Link className="hover:underline" href="/peer-grading/history">
            Report
          </Link>
          {(user?.access === "admin" ||
            user?.access === "member" ||
            user?.access === "grader") && (
            <Link className="hover:underline" href="/peer-grading/grader">
              Grade
            </Link>
          )}
        </nav>
        <main className="grow p-4">{children}</main>
      </div>
      <Footer />
    </>
  );
}
