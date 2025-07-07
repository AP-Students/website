"use client";
import React, { useEffect, useState } from "react";
import {
  collectionGroup,
  getDocs,
  updateDoc,
  orderBy,
  query,
  DocumentReference,
  deleteDoc,
  DocumentData,
} from "firebase/firestore";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  RegExpMatcher,
  TextCensor,
  asteriskCensorStrategy,
  englishDataset,
  englishRecommendedTransformers,
  keepEndCensorStrategy,
  keepStartCensorStrategy,
} from "obscenity";
import {
  Ban,
  CircleCheckBig,
  CircleDotDashed,
  CircleX,
  Ellipsis,
  Eye,
  EyeOff,
  Flag,
  Pencil,
  Trash2,
} from "lucide-react";
import { updateUserRole } from "@/components/hooks/users";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FRQSubmission, GradingStatus } from "@/types/frq";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const strategy = keepStartCensorStrategy(
  keepEndCensorStrategy(asteriskCensorStrategy()),
);
const censor = new TextCensor().setStrategy(strategy);

type GraderView = FRQSubmission & {
  ref: DocumentReference<DocumentData, DocumentData>;
  showProfanity: boolean;
  sheetOpen: boolean;
};

const FRQGraderPage = () => {
  const { user } = useUser();
  const [responses, setResponses] = useState<GraderView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllResponses = async () => {
      try {
        const q = query(
          collectionGroup(db, "frqResponses"),
          orderBy("submittedAt", "desc"),
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
              ref: docSnap.ref,
              showProfanity: false,
            }) as GraderView,
        );

        setResponses(data);
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAllResponses();
  }, []);

  const submitGrade = async (
    responseRef: DocumentReference,
    index: number,
    grade: string,
    feedback: string,
  ) => {
    try {
      await updateDoc(responseRef, {
        grade,
        feedback,
        gradedAt: new Date(),
        gradedBy: user?.uid ?? "admin",
        status: "graded",
      });

      const updatedResponses = [...responses];
      if (updatedResponses[index]) {
        updatedResponses[index].grade = grade;
        updatedResponses[index].feedback = feedback;
        updatedResponses[index].status = "graded";
        setResponses(updatedResponses);

        setUnsavedChanges(false);
        alert("Grade and feedback saved successfully!");
      } else {
        alert(
          "The change was saved successfully but was not reflected in your browser. Please reload the page.",
        );
      }
    } catch (err) {
      console.error("Error grading response:", err);
      alert("Failed to submit grade.\n" + String(err));
    }
  };

  const handleDeleteResponse = async (
    responseRef: DocumentReference,
    index: number,
  ) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      await deleteDoc(responseRef);

      const updatedResponses = [...responses];
      updatedResponses.splice(index, 1);
      setResponses(updatedResponses);
    } catch (err) {
      console.error("Error grading response:", err);
      alert("Failed to delete response.");
    }
  };

  const handleBanUser = async (
    targetUserId: string,
    responseRef: DocumentReference,
  ) => {
    if (!confirm("Are you sure you want to ban this user?")) return;

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (user.uid === targetUserId) {
      alert("You cannot ban yourself.");
      return;
    }

    try {
      await updateUserRole(user, targetUserId, "banned");
      await updateDoc(responseRef, {
        userBanned: true,
      });
      const updatedResponses = [...responses];
      updatedResponses.forEach((res) => {
        if (res.userId === targetUserId) {
          res.userBanned = true;
        }
      });
      setResponses(updatedResponses);
    } catch (err) {
      console.error("Error banning user:", err);
      alert("Failed to ban user.\n" + String(err));
    }
  };

  const updateSubmissionStatus = async (
    responseRef: DocumentReference,
    index: number,
    status: string,
  ) => {
    try {
      await updateDoc(responseRef, {
        status,
      });

      const updatedResponses = [...responses];
      if (updatedResponses[index]) {
        updatedResponses[index].status = status as GradingStatus;
        setResponses(updatedResponses);
      }
    } catch (err) {
      console.error("Error updating submission status:", err);
      alert("Failed to update submission status.\n" + String(err));
    }
  };

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [newGrade, setNewGrade] = useState("");
  const [newFeedback, setNewFeedback] = useState("");

  return (
    <>
      <h2 className="text-2xl font-bold">Grading Dashboard</h2>

      {loading ? (
        <p>Loading responses...</p>
      ) : responses.length === 0 ? (
        <p>No responses found.</p>
      ) : (
        <div className="grid gap-3">
          {responses.map((res, index) => (
            <div
              key={res.id}
              className={cn(
                "rounded-md border-2 p-3 shadow-sm",
                res.status === "graded" && res.grade && res.feedback
                  ? "border-green-600"
                  : "border-amber-300",
                res.status === "flagged" && "border-orange-500",
                res.status === "rejected" && "border-stone-400",
                res.userBanned && "border-red-700",
              )}
            >
              <div className="flex gap-2">
                <p className="mr-auto font-mono text-stone-700">
                  {res.submittedAt?.toDate
                    ? res.submittedAt.toDate().toLocaleString()
                    : "Unknown"}
                  <br />
                  UID: {res.userId} {res.userBanned && "(banned)"}
                  <br />
                  QID: <strong>{res.question?.id ?? "Unknown"}</strong>
                  <br />
                  {res.status}{" "}
                  {res.status === "graded" && !res.grade && "(missing grade)"}
                  {res.status === "graded" &&
                    !res.feedback &&
                    "(missing feedback)"}
                </p>
                <button
                  className={cn(
                    "flex h-8 items-center rounded-sm border px-4 transition-colors hover:bg-stone-200",
                    res.grade && res.feedback && "hidden",
                  )}
                  onClick={() => {
                    setNewFeedback(res.feedback ?? "");
                    setNewGrade(res.grade ?? "");
                    setResponses((prev) =>
                      prev.map((r, i) =>
                        i === index
                          ? { ...r, sheetOpen: true }
                          : { ...r, sheetOpen: false },
                      ),
                    );
                  }}
                >
                  Grade
                </button>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-sm border transition-colors hover:bg-stone-200">
                    <Ellipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {res.grade && res.feedback && (
                      <DropdownMenuItem
                        onClick={() => {
                          setNewFeedback(res.feedback ?? "");
                          setNewGrade(res.grade ?? "");
                          setResponses((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? { ...r, sheetOpen: true }
                                : { ...r, sheetOpen: false },
                            ),
                          );
                        }}
                      >
                        <Pencil /> Edit Grade
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={res.status}
                      onValueChange={(value) =>
                        updateSubmissionStatus(res.ref, index, value)
                      }
                    >
                      <DropdownMenuRadioItem
                        value="ungraded"
                        icon={<CircleDotDashed />}
                      >
                        Ungraded
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="graded"
                        icon={<CircleCheckBig className="stroke-green-500" />}
                      >
                        Graded
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="flagged"
                        icon={<Flag className="stroke-orange-500" />}
                      >
                        Flagged
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="rejected"
                        icon={<CircleX />}
                      >
                        Rejected
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    {user?.access === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteResponse(res.ref, index)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBanUser(res.userId, res.ref)}
                        >
                          <Ban /> Ban User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Sheet
                open={res.sheetOpen}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) {
                    setResponses((prev) =>
                      prev.map((r, i) =>
                        i === index
                          ? { ...r, sheetOpen: true }
                          : { ...r, sheetOpen: false },
                      ),
                    );
                    return;
                  }

                  let confirmClose = true;
                  if (unsavedChanges) {
                    confirmClose = window.confirm(
                      "You have unsaved changes. Close anyway?",
                    );
                  }

                  if (confirmClose) {
                    setResponses((prev) =>
                      prev.map((r, i) => ({ ...r, sheetOpen: false })),
                    );
                    setUnsavedChanges(false);
                    setNewGrade("");
                    setNewFeedback("");
                  }
                }}
              >
                <SheetContent className="w-1/2 !max-w-none overflow-y-scroll p-0">
                  <SheetHeader className="max-w-none p-4 pb-0">
                    <SheetTitle>Grade User Submission</SheetTitle>
                    <SheetDescription>
                      {res.submittedAt?.toDate
                        ? res.submittedAt.toDate().toLocaleString()
                        : "Unknown"}
                      <br />
                      UID: {res.userId}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="sticky top-0 grid gap-2 border-b p-4 pb-2 backdrop-blur-sm">
                    <p>
                      <strong>Question:</strong> {res.question?.id ?? "Unknown"}
                    </p>
                    <label>
                      <strong>Grade</strong>
                      <Input
                        type="text"
                        defaultValue={res.grade ?? ""}
                        onChange={(e) => {
                          setNewGrade(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="border-primary"
                      />
                    </label>
                    <label>
                      <strong>Feedback</strong>
                      <Textarea
                        defaultValue={res.feedback ?? ""}
                        onChange={(e) => {
                          setNewFeedback(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        rows={5}
                        className="border-primary"
                      />
                    </label>
                    <Button
                      variant={unsavedChanges ? "default" : "outline"}
                      className="mr-auto"
                      onClick={() =>
                        submitGrade(res.ref, index, newGrade, newFeedback)
                      }
                    >
                      Save
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 p-4">
                    <strong>User Response</strong>
                    {matcher.hasMatch(res.responseText) && (
                      <Button
                        variant={res.showProfanity ? "outline" : "destructive"}
                        className="flex gap-2"
                        onClick={() =>
                          setResponses((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? { ...r, showProfanity: !r.showProfanity }
                                : r,
                            ),
                          )
                        }
                      >
                        {res.showProfanity ? (
                          <>
                            <Eye />
                            Hide Profanity
                          </>
                        ) : (
                          <>
                            <EyeOff />
                            Show Profanity
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="m-4 mt-0 whitespace-pre-wrap rounded-md border px-3 py-2">
                    {res.showProfanity
                      ? res.responseText
                      : censor.applyTo(
                          res.responseText,
                          matcher.getAllMatches(res.responseText),
                        )}
                  </p>
                </SheetContent>
              </Sheet>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FRQGraderPage;
