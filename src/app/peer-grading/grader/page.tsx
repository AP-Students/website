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

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const strategy = keepStartCensorStrategy(
  keepEndCensorStrategy(asteriskCensorStrategy()),
);
const censor = new TextCensor().setStrategy(strategy);

const FRQGraderPage = () => {
  const { user } = useUser();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllResponses = async () => {
      try {
        const q = query(
          collectionGroup(db, "frqResponses"),
          orderBy("submittedAt", "desc"),
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((docSnap) => {
          const pathSegments = docSnap.ref.path.split("/");
          const userId = pathSegments[1]; // "users/{userId}/frqResponses/{docId}"
          return {
            id: docSnap.id,
            userId,
            ref: docSnap.ref,
            ...docSnap.data(),
            showProfanity: false,
          };
        });

        setResponses(data);
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllResponses();
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
        gradedBy: user?.uid || "admin",
        status: "graded",
      });

      const updatedResponses = [...responses];
      updatedResponses[index].grade = grade;
      updatedResponses[index].feedback = feedback;
      updatedResponses[index].status = "graded";
      setResponses(updatedResponses);

      setUnsavedChanges(false);
      alert("Grade and feedback saved successfully!");
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
      updatedResponses[index].status = status;
      setResponses(updatedResponses);
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
                  QID: <strong>{res.question?.id || "Unknown"}</strong>
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
                <SheetContent className="w-1/2 !max-w-none">
                  <SheetHeader className="max-w-none">
                    <SheetTitle>Grade User Submission</SheetTitle>
                    <SheetDescription>
                      {res.submittedAt?.toDate
                        ? res.submittedAt.toDate().toLocaleString()
                        : "Unknown"}
                      <br />
                      UID: {res.userId}
                    </SheetDescription>
                  </SheetHeader>
                  <p>
                    <strong>Question:</strong> {res.question?.id || "Unknown"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
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
                  <p className="whitespace-pre-wrap">
                    {res.showProfanity
                      ? res.responseText
                      : censor.applyTo(
                          res.responseText,
                          matcher.getAllMatches(res.responseText),
                        )}
                  </p>

                  <label>
                    <strong>Grade</strong>
                    <Input
                      type="text"
                      defaultValue={res.grade || ""}
                      onChange={(e) => {
                        setNewGrade(e.target.value);
                        setUnsavedChanges(true);
                      }}
                      className="mb-2"
                    />
                  </label>
                  <label>
                    <strong>Feedback</strong>
                    <Textarea
                      defaultValue={res.feedback || ""}
                      onChange={(e) => {
                        setNewFeedback(e.target.value);
                        setUnsavedChanges(true);
                      }}
                      rows={5}
                      className="mb-2"
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
