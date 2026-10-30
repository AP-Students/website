"use client";

import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import ProfileView from "@/components/dashboard/ProfileView";
import usePathname from "@/components/client/pathname";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { streakAsOf } from "@/lib/gamification/streak";
import { toDayKey } from "@/lib/gamification/calendarDay";

interface PublicProfile {
  displayName: string;
  photoURL?: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  timeZone: string;
  problemsSolved: number;
  subjectsCompleted: number;
  achievements: string[];
}

export default function PublicProfilePage() {
  const pathname = usePathname() ?? "";
  const uid = pathname.split("/").at(-1) ?? "";

  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setProfile(undefined);
    setFailed(false);
    if (!uid) {
      setProfile(null);
      return;
    }
    return onSnapshot(
      doc(db, "publicProfiles", uid),
      (snapshot) => {
        setProfile(
          snapshot.exists() ? (snapshot.data() as PublicProfile) : null,
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
  }, [uid]);

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
          <ProfileView
            displayName={profile.displayName}
            photoURL={profile.photoURL}
            xp={profile.xp}
                        streak={streakAsOf(
              {
                currentStreak: profile.currentStreak,
                longestStreak: profile.longestStreak,
                lastActiveDay: profile.lastActiveDay,
              },
              toDayKey(new Date(), profile.timeZone),
            )}
            problemsSolved={profile.problemsSolved}
            subjectsCompleted={profile.subjectsCompleted}
            earnedIds={new Set(profile.achievements)}
            nameAs="h1"
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
