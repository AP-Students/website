"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useUser } from "@/components/hooks/UserContext";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_XP_CONFIG,
  LEVEL_CURVE,
  XP_AMOUNT_FIELDS,
  XP_CONFIG_COLLECTION,
  XP_CONFIG_DOC,
  parseXpConfig,
  parseXpForm,
  toXpForm,
  totalXpForLevel,
  type XpAmountField,
  type XpForm,
} from "@/lib/gamification/xp";

const FIELDS: Record<XpAmountField, { label: string; help: string }> = {
  readingComplete: {
    label: "Reading completed",
    help: "Marking a chapter reading complete. Once per chapter.",
  },
  mcqTestComplete: {
    label: "MCQ test finished",
    help: "Finishing a published MCQ test. Once per test.",
  },
  mcqCorrectAnswer: {
    label: "Each correct MCQ answer",
    help: "Added on top of the above for every correct answer on that test.",
  },
  frqSubmission: {
    label: "FRQ submitted",
    help: "The first time a student submits each published FRQ. Resubmitting the same FRQ earns nothing more.",
  },
  frqGradeBonus: {
    label: "FRQ grade bonus (maximum XP)",
    help: "Maximum XP available from an FRQ grade. Separate from the XP earned for submitting the FRQ.",
  },
  streakDay: {
    label: "Daily streak bonus",
    help: "The first FRQ or MCQ test of each day, once the streak is 2 days or longer.",
  },
};

const LABELS = Object.fromEntries(
  Object.entries(FIELDS).map(([field, { label }]) => [field, label]),
) as Record<XpAmountField, string>;

const PREVIEW_LEVELS = [2, 5, 10, 25, 50];

export default function XpSettingsPage() {
  const { user } = useUser();
  const isAdmin = user?.access === "admin";
  const [form, setForm] = useState<XpForm>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    getDoc(doc(db, XP_CONFIG_COLLECTION, XP_CONFIG_DOC))
      .then((snapshot) => setForm(toXpForm(parseXpConfig(snapshot.data()))))
      .catch((loadError) => {
        console.error("Error loading XP settings:", loadError);
        setError("Couldn't load the saved XP settings. Showing the defaults.");
        setForm(toXpForm(DEFAULT_XP_CONFIG));
      });
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-3xl">
        Authenticating user...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-2xl">Only admins can change XP settings.</p>
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          Go home
        </Link>
      </div>
    );
  }

  const setAmount = (field: XpAmountField, value: string) =>
    setForm((current) =>
      current && { ...current, amounts: { ...current.amounts, [field]: value } },
    );

  const setMilestone = (
    index: number,
    changes: Partial<XpForm["milestones"][number]>,
  ) =>
    setForm(
      (current) =>
        current && {
          ...current,
          milestones: current.milestones.map((row, i) =>
            i === index ? { ...row, ...changes } : row,
          ),
        },
    );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setError("");

    const parsed = parseXpForm(form, LABELS);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }

    setSaving(true);
    try {
      // A full overwrite, not a merge, so a removed milestone is really gone.
      await setDoc(doc(db, XP_CONFIG_COLLECTION, XP_CONFIG_DOC), {
        ...parsed.config,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      setForm(toXpForm(parsed.config));
      toast.success("XP settings saved. They apply from the next award.");
    } catch (saveError) {
      console.error("Error saving XP settings:", saveError);
      setError("Couldn't save the XP settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const amountInput = (field: XpAmountField) => (
    <div key={field} className="flex flex-col gap-1">
      <Label htmlFor={field}>{FIELDS[field].label}</Label>
      <Input
        id={field}
        inputMode="numeric"
        value={form?.amounts[field] ?? ""}
        onChange={(event) => setAmount(field, event.target.value)}
        className="max-w-[10rem]"
      />
      <p className="text-sm text-gray-600">{FIELDS[field].help}</p>
    </div>
  );

  return (
    <div>
      <Navbar />

      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <Link
          className={buttonVariants({ variant: "outline", className: "self-start" })}
          href="/admin"
        >
          <ArrowLeft className="mr-2" />
          Return to Admin Dashboard
        </Link>
        <div>
          <h1 className="text-4xl font-extrabold">XP Settings</h1>
          <p className="mt-2 text-gray-600">
            How much XP students earn for each activity. Changes apply to the
            next award; XP already earned stays as it is.
          </p>
        </div>

        {!form ? (
          <p className="text-gray-500">Loading XP settings…</p>
        ) : (
          <form className="flex flex-col gap-8" onSubmit={save}>
            <section className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm">
              <h2 className="text-2xl font-bold">Activities</h2>
              {XP_AMOUNT_FIELDS.map(amountInput)}
            </section>

            <section className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold">Streak milestones</h2>
                <p className="text-sm text-gray-600">
                  A one-off bonus each time a student&apos;s streak reaches
                  this many days.
                </p>
              </div>
              {form.milestones.length === 0 && (
                <p className="text-sm text-gray-500">No milestones.</p>
              )}
              {form.milestones.map((row, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`milestone-days-${index}`}>Days</Label>
                    <Input
                      id={`milestone-days-${index}`}
                      inputMode="numeric"
                      value={row.days}
                      onChange={(event) =>
                        setMilestone(index, { days: event.target.value })
                      }
                      className="w-24"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`milestone-bonus-${index}`}>Bonus XP</Label>
                    <Input
                      id={`milestone-bonus-${index}`}
                      inputMode="numeric"
                      value={row.bonus}
                      onChange={(event) =>
                        setMilestone(index, { bonus: event.target.value })
                      }
                      className="w-28"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove the ${row.days || "new"}-day milestone`}
                    onClick={() =>
                      setForm(
                        (current) =>
                          current && {
                            ...current,
                            milestones: current.milestones.filter(
                              (_, i) => i !== index,
                            ),
                          },
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() =>
                  setForm(
                    (current) =>
                      current && {
                        ...current,
                        milestones: [
                          ...current.milestones,
                          { days: "", bonus: "" },
                        ],
                      },
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add milestone
              </Button>
            </section>

            <section className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm">
              <h2 className="text-2xl font-bold">Levels</h2>
              <p className="text-sm text-gray-600">
                Level 2 takes {LEVEL_CURVE.baseXp.toLocaleString()} XP, and
                each level after that takes{" "}
                {LEVEL_CURVE.stepXp.toLocaleString()} XP more than the one
                before. Total XP needed:{" "}
                {PREVIEW_LEVELS.map(
                  (level) =>
                    `level ${level} at ${totalXpForLevel(level).toLocaleString()}`,
                ).join(", ")}
                .
              </p>
              <p className="text-sm text-gray-600">
                Levels can&apos;t be changed here. Every award recalculates a
                student&apos;s level from their total XP, so a steeper curve
                would move students who already reached a level back down.
              </p>
            </section>

            {error && (
              <div role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save XP settings"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setError("");
                  setForm(toXpForm(DEFAULT_XP_CONFIG));
                }}
              >
                Fill in the defaults
              </Button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
