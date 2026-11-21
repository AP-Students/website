"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canGrade,
  coverageBySubject,
  coveredSubjects,
  gradersOf,
  subjectsFor,
} from "@/lib/gradingCoverage";
import {
  FRQ_SUBJECTS,
  refreshGradingCoverage,
  saveGraderSubjects,
  turnOffGradingCoverage,
} from "@/lib/firestore/gradingCoverage";
import { useGradingCoverage } from "@/components/hooks/useGradingCoverage";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// The checkboxes in the user dialog. Remount it (key={uid}) for each user.
export function SubjectChecklist({
  member,
  onSaved,
}: {
  member: User;
  onSaved: (subjects: string[]) => void;
}) {
  const [saved, setSaved] = useState(() => subjectsFor(member));
  const [checked, setChecked] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // A subject that's been renamed or removed still shows, so it can be
  // unticked instead of hanging around unseen.
  const options = [
    ...FRQ_SUBJECTS,
    ...saved.filter((subject) => !FRQ_SUBJECTS.includes(subject)),
  ];
  const changed =
    checked.length !== saved.length ||
    checked.some((subject) => !saved.includes(subject));

  const toggle = (subject: string) => {
    setStatus("");
    setChecked((current) =>
      current.includes(subject)
        ? current.filter((s) => s !== subject)
        : [...current, subject],
    );
  };

  const save = async () => {
    const subjects = options.filter((subject) => checked.includes(subject));
    setSaving(true);
    setStatus("");
    try {
      await saveGraderSubjects(member.uid, subjects);
      setSaved(subjects);
      onSaved(subjects);
      setStatus("Saved.");
    } catch (error) {
      console.error("Error saving grader subjects:", error);
      setStatus("Couldn't save: " + errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-orange-500 p-2 shadow">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="font-semibold">Subjects they can grade</h4>
        <Button size="sm" onClick={save} disabled={!changed || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      {!canGrade(member.access) && (
        <p className="mb-1 text-sm text-gray-500">
          These only count while they&apos;re a grader, member or admin.
        </p>
      )}
      <div className="max-h-64 overflow-y-auto">
        {options.map((subject) => (
          <label key={subject} className="block">
            <input
              type="checkbox"
              checked={checked.includes(subject)}
              onChange={() => toggle(subject)}
              className="mr-1"
            />
            {subject}
            {!FRQ_SUBJECTS.includes(subject) && (
              <span className="text-gray-500"> (no longer a subject)</span>
            )}
          </label>
        ))}
      </div>
      {status && <p className="mt-1 text-sm">{status}</p>}
    </div>
  );
}

// Subjects x graders, plus the switch that limits what students can pick.
export function TeamQualifications({
  users,
  onSelect,
}: {
  users: User[];
  onSelect: (user: User) => void;
}) {
  const coverage = useGradingCoverage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const graders = gradersOf(users);
  const bySubject = coverageBySubject(FRQ_SUBJECTS, graders);
  const covered = coveredSubjects(FRQ_SUBJECTS, graders);
  const shown = coverage.data?.subjects;
  const filtering = Array.isArray(shown);
  const outOfDate =
    filtering &&
    (shown.length !== covered.length ||
      covered.some((subject) => !shown.includes(subject)));

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      console.error("Error updating graded subjects:", e);
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="mb-4 rounded-lg border p-4 shadow-sm">
      <summary className="cursor-pointer text-lg">
        View team qualifications ({covered.length} of {FRQ_SUBJECTS.length}{" "}
        subjects have a grader)
      </summary>

      <div className="mt-3 space-y-2">
        <p className="text-sm opacity-70">
          Click someone in the user list (or their name below) to set which
          subjects they can grade. Only graders, members and admins count.
        </p>

        <div className="flex flex-col gap-2 rounded-md bg-gray-50 p-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            {coverage.loading
              ? "Checking what students see..."
              : !filtering
                ? "Students can pick any subject on the FRQ page right now."
                : outOfDate
                  ? "Students see an out-of-date list of subjects."
                  : `Students can only pick the ${shown.length} subjects that have a grader.`}
          </p>
          {!coverage.loading && (
            <div className="flex shrink-0 gap-2">
              {outOfDate && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => run(() => refreshGradingCoverage())}
                >
                  Update the list
                </Button>
              )}
              {filtering ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Let students pick any subject again?"))
                      void run(turnOffGradingCoverage);
                  }}
                >
                  Show every subject
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={busy || covered.length === 0}
                  onClick={() => {
                    if (
                      confirm(
                        `Students will only be able to pick the ${covered.length} subjects that have a grader. Continue?`,
                      )
                    )
                      void run(() => refreshGradingCoverage({ turnOn: true }));
                  }}
                >
                  Only show subjects with a grader
                </Button>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">Something went wrong: {error}</p>
        )}

        {graders.length === 0 ? (
          <p>No one is a grader, member or admin yet.</p>
        ) : (
          <div className="max-h-[32rem] overflow-auto rounded-md border">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 bg-white p-2 text-left">
                    Subject
                  </th>
                  <th className="sticky top-0 z-10 bg-white p-2">Graders</th>
                  {graders.map((grader) => (
                    <th
                      key={grader.uid}
                      className="sticky top-0 z-10 whitespace-nowrap bg-white p-2"
                    >
                      <button
                        className="hover:underline"
                        onClick={() => onSelect(grader)}
                      >
                        {grader.displayName || grader.email}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FRQ_SUBJECTS.map((subject) => {
                  const qualified = bySubject.get(subject) ?? [];
                  const none = qualified.length === 0;
                  return (
                    <tr
                      key={subject}
                      className={cn("border-t", none && "bg-red-50")}
                    >
                      <th
                        className={cn(
                          "sticky left-0 z-10 whitespace-nowrap p-2 text-left font-normal",
                          none ? "bg-red-50" : "bg-white",
                        )}
                      >
                        {subject}
                      </th>
                      <td
                        className={cn(
                          "p-2 text-center tabular-nums",
                          none && "font-semibold text-red-700",
                        )}
                      >
                        {none ? "None" : qualified.length}
                      </td>
                      {graders.map((grader) => (
                        <td key={grader.uid} className="p-2 text-center">
                          {qualified.includes(grader) && (
                            <Check
                              className="inline size-4 text-green-600"
                              role="img"
                              aria-label={`${grader.displayName} can grade ${subject}`}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}
