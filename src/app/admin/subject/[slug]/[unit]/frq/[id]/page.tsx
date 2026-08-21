"use client";

import FRQEditorRenderer from "@/components/frq/editorRenderer";
import { useUser } from "@/components/hooks/UserContext";
import { getFrqTemplateDocRef } from "@/lib/firestore/frqRefs";
import { normalizeFrqTemplate } from "@/lib/frq/template";
import type { FRQTemplate } from "@/types/frq";
import { getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const pathname = usePathname() ?? "";
  const { user, loading: userLoading } = useUser();

  const pathParts = pathname.split("/").slice(-4);
  const subject = pathParts[0] ?? "";
  const unitId = pathParts[1] ?? "";
  const frqId = pathParts[3] ?? "";

  const [frqTemplate, setFrqTemplate] = useState<FRQTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Firestore rules are the real gate, but without a UI check an unauthorized
  // visitor gets the full editor and only discovers the denial when Save fails.
  const canEdit = user?.access === "admin" || user?.access === "member";

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!canEdit) {
      setIsLoading(false);
      return;
    }

    if (!subject || !unitId || !frqId) {
      setLoadError("This FRQ address is not valid.");
      setIsLoading(false);
      return;
    }

    const loadFrq = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const docSnap = await getDoc(
          getFrqTemplateDocRef(subject, unitId, frqId),
        );

        if (!docSnap.exists()) {
          setLoadError("This FRQ no longer exists.");
          setFrqTemplate(null);
          return;
        }

        setFrqTemplate(
          normalizeFrqTemplate(docSnap.data(), {
            id: docSnap.id,
            subject,
            unitId,
          }),
        );
      } catch (error) {
        console.error("Error loading FRQ template:", error);

        setLoadError(
          error instanceof Error
            ? `Could not load this FRQ: ${error.message}`
            : "Could not load this FRQ.",
        );
        setFrqTemplate(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFrq();
  }, [userLoading, canEdit, subject, unitId, frqId]);

  if (userLoading || isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!canEdit) {
    return (
      <div className="p-8">
        You need porter or admin access to edit FRQs.
      </div>
    );
  }

  if (loadError) {
    return <div className="p-8">{loadError}</div>;
  }

  return (
    <FRQEditorRenderer
      frqFound={frqTemplate !== null}
      frqTemplate={frqTemplate}
    />
  );
};

export default Page;
