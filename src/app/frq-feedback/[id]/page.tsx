"use client";

import FRQFeedbackRenderer from "@/components/frq/feedbackRenderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import usePathname from "@/components/client/pathname";

type FeedbackStatus = "loading" | "found" | "not-found";

const Page = () => {
  const pathname = usePathname() ?? "";
  const frqId = pathname.split("/").at(-1) ?? "";
  const [status, setStatus] = useState<FeedbackStatus>("loading");

  useEffect(() => {
    const fetchFeedback = async () => {
      setStatus("loading");
      try {
        const docRef = doc(db, "gradedFrqSubmissions", frqId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      } catch (error: unknown) {
        console.error("Error fetching FRQ feedback:", error);
        setStatus("not-found");
      }
    };

    void fetchFeedback();
  }, [frqId]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <FRQFeedbackRenderer />
    </div>
  );
};

export default Page;
