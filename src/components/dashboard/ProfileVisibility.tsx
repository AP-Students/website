"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";

async function setProfileVisibility(isPublic: boolean) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");

  const response = await fetch("/api/profile/visibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ isPublic }),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export default function ProfileVisibility({ uid }: { uid: string }) {
  const [isPublic, setIsPublic] = useState<boolean>();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "publicProfiles", uid))
      .then((snapshot) => {
        if (!cancelled) setIsPublic(snapshot.data()?.isPublic === true);
      })
      .catch(() => {
        if (!cancelled) setIsPublic(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const change = async (next: boolean) => {
    setSaving(true);
    try {
      await setProfileVisibility(next);
      setIsPublic(next);
      setConfirming(false);
    } catch (error) {
      console.error("Error changing profile visibility:", error);
      toast.error("Couldn't change your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/profile/${uid}`,
      );
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-2xl rounded-lg border border-gray-300 bg-white p-4 shadow">
      <h2 id="profile-visibility" className="text-2xl font-bold">
        Public profile
      </h2>
      <p className="mt-1 text-gray-600">
        {isPublic
          ? "Anyone with the link can see the profile above."
          : "Only you can see the profile above."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic === true}
          aria-labelledby="profile-visibility"
          disabled={isPublic === undefined || saving}
          onClick={() => (isPublic ? void change(false) : setConfirming(true))}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50",
            isPublic ? "bg-primary" : "bg-gray-300",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow motion-safe:transition-transform",
              isPublic ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
        <span className="font-semibold">{isPublic ? "Public" : "Private"}</span>
        {isPublic && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyLink()}
          >
            Copy link
          </Button>
        )}
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make your profile public?</DialogTitle>
            <DialogDescription>
              Anyone with the link will see this, even if they aren&apos;t
              logged in:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 text-sm">
            <li>Your name and photo</li>
            <li>Your level and XP</li>
            <li>Your current streak</li>
            <li>Problems solved and subjects completed</li>
            <li>The achievements you&apos;ve earned</li>
          </ul>
          <p className="text-sm text-gray-600">
            Your email, activity and calendar always stay private. You can
            switch back to private at any time.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void change(true)}
            >
              Make public
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
