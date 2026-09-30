"use client";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import { useUser } from "@/components/hooks/UserContext";
import { useRouter } from "next/navigation";
import ExperienceCard from "@/components/dashboard/ExperienceCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MyClasses from "@/components/dashboard/MyClasses";
import GlobalStats from "@/components/dashboard/GlobalStats";
import StreakBar from "@/components/dashboard/StreakBar";
import {
  FIXTURE_CALENDAR,
  FIXTURE_STATS,
  FIXTURE_EVENTS,
  FIXTURE_IN_PROGRESS,
  FIXTURE_IN_PROGRESS_READINGS,
  FIXTURE_NOTIFICATIONS,
} from "@/lib/dashboard/fixtures";
import AchievementsCard from "@/components/dashboard/AchievementsCard";
import { checkAchievements } from "@/lib/achievements/checkAchievements";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SavedAndInProgress from "@/components/dashboard/SavedAndInProgress";
import { listSavedItems, unsaveItem } from "@/lib/savedItems";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types/user";
import type { SavedItem } from "@/types/dashboard";

const FIXTURE_TODAY = new Date(2026, 8, 20);
const FIXTURE_EARNED = new Set(
  checkAchievements(FIXTURE_STATS, new Set()).map(
    (achievement) => achievement.id,
  ),
);

export default function Dashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const [userDoc, setUserDoc] = useState<User | null | undefined>(undefined);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    setUserDoc(undefined);
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        setUserDoc(
          snapshot.exists()
            ? { ...(snapshot.data() as Omit<User, "uid">), uid: snapshot.id }
            : null,
        );
      },
      (error) => {
        console.error("Error loading user:", error);
        setUserDoc(null);
      },
    );
  }, [uid]);

  // The user's actual saved readings/problems — reuse the dashboard SavedItem
  // contract instead of a separate model or a fixture.
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    listSavedItems(uid)
      .then((items) => {
        if (!cancelled) setSavedItems(items);
      })
      .catch((error) => {
        console.error("Error loading saved items:", error);
        if (!cancelled) setSavedItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Waits for the delete before dropping the row, so a failed delete never
  // leaves an item that looks removed but comes back on the next load.
  const removeSaved = async (id: string) => {
    if (!uid) return;
    try {
      await unsaveItem(uid, id);
      setSavedItems((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing saved item:", error);
      toast.error("Couldn't remove this item. Please try again.");
    }
  };

  if (loading || !user) {
    return (
      <div>
        <Navbar />
        <div
          role="status"
          className="flex min-h-[60vh] items-center justify-center text-gray-500"
        >
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <DashboardHeader
        user={userDoc ?? user}
        notifications={FIXTURE_NOTIFICATIONS}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-8 py-10 md:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          <ExperienceCard
            level={FIXTURE_STATS.level}
            xpIntoLevel={FIXTURE_STATS.xpIntoLevel}
            xpForNextLevel={FIXTURE_STATS.xpForNextLevel}
          />
          <StreakBar
            currentStreak={FIXTURE_STATS.currentStreak}
            lastActiveDay={FIXTURE_STATS.lastActiveDay}
            calendarDays={FIXTURE_CALENDAR.days}
            today={FIXTURE_TODAY}
          />
          <GlobalStats
            problemsSolved={FIXTURE_STATS.problemsSolved}
            subjectsCompleted={FIXTURE_STATS.subjectsCompleted}
            totalXp={FIXTURE_STATS.xp}
          />
          <RecentActivity events={FIXTURE_EVENTS} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
          <AchievementsCard stats={FIXTURE_STATS} earnedIds={FIXTURE_EARNED} />
          {userDoc === undefined ? (
            <p className="text-gray-500">Loading your classes…</p>
          ) : (
            <MyClasses
              uid={user.uid}
              subjectSlugs={userDoc?.mySubjects ?? []}
            />
          )}
          <SavedAndInProgress
            saved={savedItems}
            inProgress={FIXTURE_IN_PROGRESS}
            inProgressReadings={FIXTURE_IN_PROGRESS_READINGS}
            onRemoveSaved={(id) => void removeSaved(id)}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
