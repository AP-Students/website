"use client";

import usePathname from "@/components/client/pathname";
import FRQTestRenderer from "@/components/frq/testRenderer";
import { getFrqTemplateDocRef } from "@/lib/firestore/frqRefs";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname();

  const basePath = pathname
    .split("/")
    .filter(Boolean)
    .slice(-4)
    .join("_");

  const subject = basePath.split("_")[0]!;
  const unitId = basePath.split("_")[1]?.split("-").at(-1);
  const frqId = basePath.split("_")[3]!;

  const [frq, setFrq] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFRQ = async () => {
      setLoading(true);
      setError(null);
      setFrq(null);

      try {
        if (!subject || !unitId || !frqId) {
          setError("Invalid FRQ route.");
          return;
        }

        const docRef = getFrqTemplateDocRef(
          subject,
          unitId,
          frqId,
        );

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFrq({
            id: docSnap.id,
            ...docSnap.data(),
            subject,
            unitId,
          });
        } else {
          setFrq(null);
        }
      } catch (error: unknown) {
        console.error("Error fetching FRQ data:", error);
        setError("Error fetching FRQ data.");
      } finally {
        setLoading(false);
      }
    };

    void fetchFRQ();
  }, [subject, unitId, frqId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!frq) {
    return <div>FRQ not found.</div>;
  }

  return <FRQTestRenderer frq={frq} />;
};

export default Page;
