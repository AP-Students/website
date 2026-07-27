"use client";

import { useState } from "react";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/components/hooks/UserContext";
import type { GradableFRQSubmission } from "@/types/frq";

type FRQGradingRendererProps = {
  frq: GradableFRQSubmission | null;
};

const FRQGradingRenderer = ({ frq }: FRQGradingRendererProps) => {
  const { user } = useUser();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  if (!frq) {
    return <div>FRQ not found.</div>;
  }

  const saveGrade = async () => {
    if (!frq.id || !user || !score.trim() || !feedback.trim()) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const resultRef = doc(collection(db, "gradedFrqSubmissions"));
      const queueRef = doc(db, "gradableFrqSubmissions", frq.id);

      batch.set(resultRef, {
        sourceSubmissionId: frq.id,
        templateId: frq.templateId,
        studentId: frq.studentId,
        responses: frq.responses,
        submittedAt: frq.submittedAt,
        score: score.trim(),
        feedback: feedback.trim(),
        graderId: user.uid,
        gradedAt: serverTimestamp(),
      });
      batch.delete(queueRef);
      await batch.commit();
      window.alert("Grade and feedback saved.");
    } catch (error) {
      console.error("Error saving FRQ grade:", error);
      window.alert("Unable to save the grade. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Grade FRQ submission</h1>
      <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-4">
        {frq.responses.join("\n\n")}
      </pre>
      <label className="block">
        <span className="font-semibold">Score</span>
        <input
          className="mt-1 w-full rounded border p-2"
          value={score}
          onChange={(event) => setScore(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="font-semibold">Feedback</span>
        <textarea
          className="mt-1 w-full rounded border p-2"
          rows={6}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={saving || !score.trim() || !feedback.trim()}
        onClick={() => void saveGrade()}
      >
        {saving ? "Saving..." : "Save grade"}
      </button>
    </div>
  );
};

export default FRQGradingRenderer;
