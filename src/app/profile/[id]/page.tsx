"use client";

import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import ProfileView from "@/components/dashboard/ProfileView";
import usePathname from "@/components/client/pathname";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useUser } from "@/components/hooks/UserContext";

type PublicProfile = {
  isPublic?: boolean;
  displayName: string;
  photoURL?: string;
  xp: number;
  currentStreak: number;
  problemsSolved: number;
  subjectsCompleted: number;
  achievements: { id: string; title: string }[];
};

export default function PublicProfilePage() {
  const pathname = usePathname() ?? "";
  const uid = pathname.split("/").at(-1) ?? "";
  // Who's looking decides what Firestore lets through, so wait for sign-in.
  const { user, loading } = useUser();
  const viewer = user?.uid;

  const [streak, setStreak] = useState<number>();
  useEffect(() => {
    setStreak(undefined);
    if (!uid || loading) return;
    let cancelled = false;
    void (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/profile/${uid}/streak`, {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        const body = response.ok
          ? ((await response.json()) as { currentStreak?: number })
          : null;
        if (!cancelled) setStreak(body?.currentStreak);
      } catch {
        //keep showing the stored streak
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, viewer, loading]);
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(
    undefined,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setProfile(undefined);
    setFailed(false);
    if (loading) return;
    if (!uid) {
      setProfile(null);
      return;
    }
    return onSnapshot(
      doc(db, "profiles", uid),
      (snapshot) => {
        // A profile that isn't public can only be read by its owner or a
        // friend. Owners still see what strangers see.
        const data = snapshot.data() as PublicProfile | undefined;
        setProfile(
          data && (data.isPublic === true || (viewer && viewer !== uid))
            ? data
            : null,
        );
      },
      (error) => {
        if (error.code === "permission-denied") {
          setProfile(null);
          return;
        }
        console.error("Error loading profile:", error);
        setFailed(true);
      },
    );
  }, [uid, viewer, loading]);

  return (
    <div>
      <Navbar />
      <main className="px-4 py-10 sm:px-8">
        {failed ? (
          <p
            role="alert"
            className="mx-auto max-w-2xl rounded-md bg-red-100 p-4 text-red-700"
          >
            Couldn&apos;t load this profile. Refresh to try again.
          </p>
        ) : profile === undefined ? (
          <p role="status" className="text-center text-gray-500">
            Loading profile…
          </p>
        ) : profile === null ? (
          <h1 className="text-center text-2xl font-bold">
            This profile is private.
          </h1>
        ) : (
          <>
            {profile.isPublic !== true && (
              <p className="mx-auto mb-6 max-w-2xl rounded-md bg-gray-100 p-3 text-center text-sm text-gray-700">
                Only friends can see this profile.
              </p>
            )}
            <ProfileView
              displayName={profile.displayName}
              photoURL={profile.photoURL}
              xp={profile.xp}
              streak={streak ?? profile.currentStreak}
              problemsSolved={profile.problemsSolved}
              subjectsCompleted={profile.subjectsCompleted}
              earnedIds={new Set(profile.achievements.map((a) => a.id))}
              nameAs="h1"
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
