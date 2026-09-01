"use client";

import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import Link from "next/link";
import { useUser } from "@/components/hooks/UserContext";
import { getGradedFrqsCollectionRef } from "@/lib/firestore/frqRefs";
import {
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

type GradedFrqRow = {
  id: string;
  templateId: string;
  subject: string;
  unitId: string;
  score: string;
  gradedAt: Timestamp | null;
};

const Page = () => {
  const { user, loading: userLoading } = useUser();

  const [frqs, setFrqs] = useState<GradedFrqRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading || !user) {
      return;
    }

    const fetchGradedFrqs = async () => {
      try {
        const gradedQuery = query(
          getGradedFrqsCollectionRef(),
          where("studentId", "==", user.uid),
          orderBy("gradedAt", "desc"),
        );

        const snapshot = await getDocs(gradedQuery);

        setFrqs(
          snapshot.docs.map((gradedDoc) => {
            const data = gradedDoc.data();

            return {
              id: gradedDoc.id,
              templateId:
                typeof data.templateId === "string" ? data.templateId : "",
              subject: typeof data.subject === "string" ? data.subject : "",
              unitId: typeof data.unitId === "string" ? data.unitId : "",
              score: typeof data.score === "string" ? data.score : "",
              gradedAt:
                data.gradedAt instanceof Timestamp ? data.gradedAt : null,
            };
          }),
        );
      } catch (error) {
        console.error("Error fetching graded FRQs:", error);
        setLoadError("Could not load your FRQ results. Please try again.");
      }
    };

    void fetchGradedFrqs();
  }, [user, userLoading]);

  if (userLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto mt-12 w-full max-w-6xl flex-1 px-8 pb-8">
          <h1 className="text-4xl font-bold">Sign in required</h1>
          <p className="mt-4 text-gray-600">
            Sign in to view feedback on your graded FRQs.
          </p>
        </main>
        <Footer className="w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto mt-12 w-full max-w-6xl flex-1 px-8 pb-8">
        <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
          My FRQ Results
        </h1>

        {loadError && (
          <div className="mt-8 rounded-md border border-red-400 bg-red-50 p-4 text-red-700">
            {loadError}
          </div>
        )}

        {!loadError && frqs === null && (
          <div className="mt-8 p-4">Loading your results...</div>
        )}

        {!loadError && frqs !== null && frqs.length === 0 && (
          <div className="mt-8 rounded-md border border-yellow-400 bg-yellow-50 p-4">
            <p>
              You don&apos;t have any graded FRQs yet. Once a grader reviews
              your submission, it will show up here.
            </p>
          </div>
        )}

        {!loadError && frqs !== null && frqs.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-md border border-gray-300 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-sm font-semibold">
                  <tr>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Graded</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {frqs.map((frq) => (
                    <tr
                      key={frq.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">{frq.subject || "Unknown"}</td>
                      <td className="px-4 py-3">{frq.unitId || "Unknown"}</td>
                      <td className="px-4 py-3">{frq.score || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {frq.gradedAt
                          ? frq.gradedAt.toDate().toLocaleString()
                          : "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/frq-feedback/${frq.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          View Feedback
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer className="w-full" />
    </div>
  );
};

export default Page;
