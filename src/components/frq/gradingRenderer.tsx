"use client";

import { useState } from "react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
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
      // The submission ID is the grade ID. A transaction makes the queue item
      // a one-time claim: concurrent graders cannot create competing grades.
      const resultRef = doc(db, "gradedFrqSubmissions", frq.id);
      const queueRef = doc(db, "gradableFrqSubmissions", frq.id);

      await runTransaction(db, async (transaction) => {
        const [queueSnapshot, resultSnapshot] = await Promise.all([
          transaction.get(queueRef),
          transaction.get(resultRef),
        ]);

        if (!queueSnapshot.exists() || resultSnapshot.exists()) {
          throw new Error("This submission has already been graded.");
        }

        const queuedSubmission = queueSnapshot.data() as GradableFRQSubmission;
        transaction.set(resultRef, {
          sourceSubmissionId: frq.id,
          templateId: queuedSubmission.templateId,
          studentId: queuedSubmission.studentId,
          responses: queuedSubmission.responses,
          submittedAt: queuedSubmission.submittedAt,
          score: score.trim(),
          feedback: feedback.trim(),
          graderId: user.uid,
          gradedAt: serverTimestamp(),
        });
        transaction.delete(queueRef);
      });
      window.alert("Grade and feedback saved.");
    } catch (error) {
      console.error("Error saving FRQ grade:", error);
      window.alert(
        error instanceof Error &&
          error.message === "This submission has already been graded."
          ? "This submission was just graded by someone else. Refresh the queue."
          : "Unable to save the grade. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Grade FRQ submission</h1>
      <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-4">
        {Object.entries(frq.responses)
          .map(([questionId, response]) => `${questionId}:\n${response}`)
          .join("\n\n")}
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
