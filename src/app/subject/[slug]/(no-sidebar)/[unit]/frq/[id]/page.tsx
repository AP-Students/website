"use client";

import usePathname from "@/components/client/pathname";
import FRQTestRenderer from "@/components/frq/testRenderer";
import { getFrqTemplateDocRef } from "@/lib/firestore/frqRefs";
import { normalizeFrqTemplate } from "@/lib/frq/template";
import { db } from "@/lib/firebase";
import type { FRQTemplate } from "@/types/frq";
import type { ReferenceSheet, Subject } from "@/types/firestore";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * The unit segment is built as `unit-{displayNumber}-{unitId}`, so the id is
 * everything after the second dash rather than the last dash-delimited chunk —
 * that keeps working if a unit id ever contains a dash.
 */
const parseUnitId = (unitSegment: string | undefined) => {
  const parts = (unitSegment ?? "").split("-");

  return parts.length > 2 ? parts.slice(2).join("-") : "";
};

const Page = () => {
  const pathname = usePathname();

  const pathParts = pathname.split("/").filter(Boolean).slice(-4);
  const subject = pathParts[0] ?? "";
  const unitId = parseUnitId(pathParts[1]);
  const frqId = pathParts[3] ?? "";

  const [template, setTemplate] = useState<FRQTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referenceSheet, setReferenceSheet] = useState<ReferenceSheet | null>(
    null,
  );

  useEffect(() => {
    const fetchFRQ = async () => {
      setLoading(true);
      setError(null);
      setTemplate(null);

      if (!subject || !unitId || !frqId) {
        setError("This FRQ address is not valid.");
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(
          getFrqTemplateDocRef(subject, unitId, frqId),
        );

        if (!docSnap.exists()) {
          setError("FRQ not found.");
          return;
        }

        const normalizedTemplate = normalizeFrqTemplate(docSnap.data(), {
          id: docSnap.id,
          subject,
          unitId,
        });

        setTemplate(normalizedTemplate);

        if (
          normalizedTemplate.referenceSheetEnabled &&
          normalizedTemplate.referenceSheetId
        ) {
          // Isolated from the outer catch: a broken reference sheet should
          // leave the toolbar showing "unavailable," not fail the whole FRQ.
          try {
            const subjectSnap = await getDoc(doc(db, "subjects", subject));
            const subjectData = subjectSnap.exists()
              ? (subjectSnap.data() as Subject)
              : null;

            setReferenceSheet(
              subjectData?.referenceSheets?.find(
                (sheet) => sheet.id === normalizedTemplate.referenceSheetId,
              ) ?? null,
            );
          } catch (referenceSheetError) {
            console.error(
              "Error fetching reference sheet:",
              referenceSheetError,
            );
            setReferenceSheet(null);
          }
        } else {
          setReferenceSheet(null);
        }
      } catch (fetchError: unknown) {
        console.error("Error fetching FRQ data:", fetchError);

        setError(
          fetchError instanceof Error
            ? `Error fetching FRQ data: ${fetchError.message}`
            : "Error fetching FRQ data.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchFRQ();
  }, [subject, unitId, frqId]);

  return (
    <FRQTestRenderer
      template={template}
      loading={loading}
      error={error}
      referenceSheet={referenceSheet}
    />
  );
};

export default Page;
