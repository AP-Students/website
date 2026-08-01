"use client";

import FRQEditorRenderer from "@/components/frq/editorRenderer";
import { db } from "@/lib/firebase";
import type { FRQTemplate } from "@/types/frq";
import { doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname() ?? "";

  const pathParts = pathname.split("/").slice(-4);
  const subject = pathParts[0] ?? "";
  const unitId = pathParts[1] ?? "";
  const frqId = pathParts[3] ?? "";

  const [frqTemplate, setFrqTemplate] = useState<FRQTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [frqFound, setFrqFound] = useState(false);

  useEffect(() => {
    if (!subject || !unitId || !frqId) {
      setFrqFound(false);
      setIsLoading(false);
      return;
    }

    const loadFrq = async () => {
      try {
        const docRef = doc(db, "frqTemplates", frqId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setFrqFound(false);
          return;
        }

        const loadedFrq: FRQTemplate = {
          id: docSnap.id,
          ...(docSnap.data() as Omit<FRQTemplate, "id">),
        };

        const belongsToRoute =
          loadedFrq.subject === subject &&
          loadedFrq.unitId === unitId;

        if (!belongsToRoute) {
          setFrqFound(false);
          return;
        }

        setFrqTemplate(loadedFrq);
        setFrqFound(true);
      } catch {
        setFrqFound(false);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFrq();
  }, [subject, unitId, frqId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <FRQEditorRenderer
      frqFound={frqFound}
      frqTemplate={frqTemplate}
    />
  );
};

export default Page;
