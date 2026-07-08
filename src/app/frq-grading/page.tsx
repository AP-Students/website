"use client";

import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

const Page = () => {
  const [frqIds, setFrqIds] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchFrqs = async () => {
      const collectionRef = collection(db, "ungraded-frqs");
      const snapshot = await getDocs(collectionRef);
      console.log("FRQ docs:", snapshot.docs.map((doc) => doc.id));

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