"use client";

type TimeUpModalProps = {
  submitting: boolean;
  onContinue: () => void;
  onSubmit: () => void;
};

/** Shown once the clock reaches zero. The student may still keep working. */
export const TimeUpModal = ({
  submitting,
  onContinue,
  onSubmit,
}: TimeUpModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="time-up-title"
  >
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 id="time-up-title" className="text-xl font-bold">
        Time is up
      </h2>

      <p className="mt-3 text-sm text-gray-600">
        Your time has ended. You can submit your test now or continue working.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className="rounded border border-gray-400 px-4 py-2 font-semibold"
          onClick={onContinue}
        >
          Continue Working
        </button>

        <button
          type="button"
          className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
      </div>
    </div>
  </div>
);

type SubmissionModalProps = {
  submitting: boolean;
  onDownload: () => void;
  onSubmit: () => void;
  onSelfGrade: () => void;
  onClose: () => void;
};

/**
 * Final gate before the responses are written. Both paths store the same
 * submission; they differ only in who grades it afterwards, so the choice is
 * made here rather than by a separate flow.
 */
export const SubmissionModal = ({
  submitting,
  onDownload,
  onSubmit,
  onSelfGrade,
  onClose,
}: SubmissionModalProps) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="submission-title"
  >
    <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
      <button
        type="button"
        aria-label="Close submission popup"
        className="absolute right-4 top-3 text-2xl text-gray-500 hover:text-black"
        onClick={onClose}
      >
        ×
      </button>

      <h2 id="submission-title" className="text-2xl font-bold">
        Submit Your Test
      </h2>

      <p className="mt-3 text-sm text-gray-600">
        Download a copy of your responses, grade them yourself against the
        rubric, or send them to the FiveHive graders.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          className="rounded border border-blue-700 px-5 py-3 font-semibold text-blue-700"
          onClick={onDownload}
        >
          Download Responses as PDF
        </button>

        <button
          type="button"
          className="rounded border border-blue-700 px-5 py-3 font-semibold text-blue-700 disabled:opacity-50"
          onClick={onSelfGrade}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Grade It Myself"}
        </button>

        <button
          type="button"
          className="rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit to FiveHive Graders"}
        </button>

        <button
          type="button"
          className="rounded border border-black px-5 py-3 font-semibold text-black hover:bg-gray-100"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);
