"use client";

import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const Page = () => {
  const [frqIds, setFrqIds] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchFrqs = async () => {
      const collectionRef = collection(db, "gradableFrqSubmissions");
      const snapshot = await getDocs(
        query(collectionRef, orderBy("submittedAt", "desc")),
      );
      setFrqIds(snapshot.docs.map((doc) => doc.id));
    };

    fetchFrqs().catch((error) => {
      console.error("Error fetching ungraded FRQs:", error);
      setFrqIds([]);
    });
  }, []);

  if (frqIds === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Ungraded FRQs</h1>

      {frqIds.length === 0 ? (
        <p>No ungraded FRQs found.</p>
      ) : (
        <ul>
          {frqIds.map((id) => (
            <li key={id}>
              <Link href={`/frq-grading/${id}`}>{id}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Page;
