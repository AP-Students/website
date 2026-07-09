"use client";

import FRQGradingRenderer from "@/components/frq/gradingRenderer";
import { db } from "@/lib/firebase";
import type { FRQSubmission } from "@/types/frq";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

type PageProps = {
  params: {
    id: string;
  };
};

const Page = ({ params }: PageProps) => {
  const [frq, setFrq] = useState<FRQSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFrq = async () => {
      try {
        const docRef = doc(db, "ungraded-frqs", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFrq({
            id: docSnap.id,
            ...(docSnap.data() as FRQSubmission),
          });
        } else {
          setFrq(null);
        }
      } catch (error) {
        console.error("Error fetching FRQ:", error);
        setFrq(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFrq();
  }, [params.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <FRQGradingRenderer frq={frq ?? null} />;
};

export default Page;