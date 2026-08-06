"use client";

import FRQTestRenderer from "@/components/frq/testRenderer";
import usePathname from "@/components/client/pathname";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname();

  const basePath = pathname.split("/").filter(Boolean).slice(-4).join("_");

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
        // FRQs are stored under their subject/unit
        const docRef = doc(
          db,
          "subjects",
          subject,
          "units",
          unitId!,
          "frqs",
          frqId,
        );

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFrq({
            id: docSnap.id,
            ...docSnap.data(),
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

    fetchFRQ().catch((error) => {
      console.error("Error fetching FRQ data:", error);
      setError("Error fetching FRQ data.");
      setLoading(false);
    });
  }, [subject, unitId, frqId]);

  return <FRQTestRenderer frq={frq} loading={loading} error={error} />;
};

export default Page;
