"use client";

import FRQEditorRenderer from "@/components/frq/editorRenderer";
import { getFrqTemplateDocRef } from "@/lib/firestore/frqRefs";
import type { FRQTemplate } from "@/types/frq";
import { getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname() ?? "";

  const pathParts = pathname.split("/").slice(-4);
  const subject = pathParts[0] ?? "";
  const unitId = pathParts[1] ?? "";
  const frqId = pathParts[3] ?? "";

  const [frqTemplate, setFrqTemplate] =
    useState<FRQTemplate | null>(null);
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
        const docRef = getFrqTemplateDocRef(
          subject,
          unitId,
          frqId,
        );

        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setFrqFound(false);
          setFrqTemplate(null);
          return;
        }

        const loadedFrq: FRQTemplate = {
          id: docSnap.id,
          ...(docSnap.data() as Omit<FRQTemplate, "id">),
        };

        setFrqTemplate(loadedFrq);
        setFrqFound(true);
      } catch {
        setFrqFound(false);
        setFrqTemplate(null);
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