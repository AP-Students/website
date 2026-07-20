"use client";

import FRQEditorRenderer from "@/components/frq/editorRenderer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname() ?? "";

  const instanceId = pathname.split("/").slice(-4).join("_");
  const subject = instanceId.split("_")[0]!;
  const unitId = instanceId.split("_")[1]!;
  const frqId = instanceId.split("_")[3]!;

  const [frqFound, setFrqFound] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const docRef = doc(
        db,
        "subjects",
        subject,
        "units",
        unitId,
        "frqs",
        frqId,
      );

      const docSnap = await getDoc(docRef);
      setFrqFound(docSnap.exists());
    })().catch((error) => {
      console.error("Error fetching FRQ:", error);
      setFrqFound(false);
    });
  }, [subject, unitId, frqId]);

  if (frqFound === null) {
    return <div>Loading...</div>;
  }

  return <FRQEditorRenderer frqFound={frqFound} />;
};

export default Page;
