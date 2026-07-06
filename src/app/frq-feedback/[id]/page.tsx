
"use client";

import FRQFeedbackRenderer from "@/components/frq/feedbackRenderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

type FeedbackStatus = "loading" | "found" | "not-found";
type PageStuff = {
  params: {
    id: string;
  };
};

const Page = (props: PageStuff) => {
  const frqId = props.params.id;
  const [status, setStatus] = useState<FeedbackStatus>("loading");

  useEffect(() => {
    const fetchFeedback = async () => {
      setStatus("loading");
      try {
        const docRef = doc(
          db, 
          "frq-feedback", 
          frqId
        );
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
  <div className="px-8 py-12">
    <FRQFeedbackRenderer 
      feedbackFound={status === "found"} 
    />
  </div>
  );
};

export default Page;
