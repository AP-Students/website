"use client";
import Link from "next/link";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import { useUser } from "@/components/hooks/UserContext";
import { useRouter } from "next/navigation";
import ExperienceCard from "@/components/dashboard/ExperienceCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardTabs, {
  TabPlaceholder,
} from "@/components/dashboard/DashboardTabs";
import MyClasses from "@/components/dashboard/MyClasses";
import GlobalStats from "@/components/dashboard/GlobalStats";
import StreakBar from "@/components/dashboard/StreakBar";
import ActivityCalendar from "@/components/dashboard/ActivityCalendar";
import {
  FIXTURE_STATS,
  FIXTURE_IN_PROGRESS,
  FIXTURE_IN_PROGRESS_READINGS,
} from "@/lib/dashboard/fixtures";
import AchievementsCard from "@/components/dashboard/AchievementsCard";
import { useAchievements } from "@/components/hooks/useAchievements";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SubmissionHistory from "@/components/dashboard/SubmissionHistory";
import SavedAndInProgress, {
  InProgressList,
  SavedList,
} from "@/components/dashboard/SavedAndInProgress";
import { listSavedItems, unsaveItem } from "@/lib/savedItems";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types/user";
import type { SavedItem } from "@/types/dashboard";
import { useStudyStreak } from "@/components/hooks/useStudyStreak";
import { useXpProgress } from "@/components/hooks/useXpProgress";
import { useNotifications } from "@/components/hooks/useNotifications";
import NotificationFeed from "@/components/dashboard/NotificationFeed";

function LoadError({ children }: { children: string }) {
  return (
    <p role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
      {children}
    </p>
  );
}

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
  const { studyStreak, error: streakError } = useStudyStreak(uid);
  const { progress: xpProgress, error: xpError } = useXpProgress(uid);
  const {
    stats: achievementStats,
    earnedIds,
    error: achievementError,
  } = useAchievements(uid);
  const {
    notifications,
    error: notificationError,
    markRead,
  } = useNotifications(uid);

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

  const overview = (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      {/* Left column */}
      <div className="flex flex-col gap-8">
        {xpProgress ? (
          <ExperienceCard
            level={xpProgress.level}
            xpIntoLevel={xpProgress.xpIntoLevel}
            xpForNextLevel={xpProgress.xpForNextLevel}
          />
        ) : xpError ? (
          <LoadError>
            Couldn&apos;t load your XP. Refresh to try again.
          </LoadError>
        ) : (
          <p className="text-gray-500">Loading your XP…</p>
        )}
        {studyStreak ? (
          <StreakBar
            streak={studyStreak.streak}
            timeZone={studyStreak.timeZone}
            calendarDays={studyStreak.calendarDays}
          />
        ) : streakError ? (
          <LoadError>
            Couldn&apos;t load your streak. Refresh to try again.
          </LoadError>
        ) : (
          <p className="text-gray-500">Loading your streak…</p>
        )}
        <GlobalStats
          problemsSolved={FIXTURE_STATS.problemsSolved}
          subjectsCompleted={
            achievementError ? null : achievementStats.subjectsCompleted
          }
          totalXp={xpProgress?.xp ?? null}
        />
        <RecentActivity uid={user.uid} />
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-8">
        {achievementError ? (
          <LoadError>
            Couldn&apos;t load your achievements. Refresh to try again.
          </LoadError>
        ) : (
          <AchievementsCard stats={achievementStats} earnedIds={earnedIds} />
        )}
        {userDoc === undefined ? (
          <p className="text-gray-500">Loading your classes…</p>
        ) : (
          <MyClasses uid={user.uid} subjectSlugs={userDoc?.mySubjects ?? []} />
        )}
        <SavedAndInProgress
          saved={savedItems}
          inProgress={FIXTURE_IN_PROGRESS}
          inProgressReadings={FIXTURE_IN_PROGRESS_READINGS}
          onRemoveSaved={(id) => void removeSaved(id)}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <DashboardHeader
        user={userDoc ?? user}
        notifications={notifications}
        markRead={markRead}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {notificationError && (
          <LoadError>
            Couldn&apos;t load your notifications. Refresh to try again.
          </LoadError>
        )}
        <NotificationFeed notifications={notifications} markRead={markRead} />
        <DashboardTabs
          panels={{
            overview,
            history: <SubmissionHistory uid={user.uid} />,
            calendar: studyStreak ? (
              <ActivityCalendar
                calendarDays={studyStreak.calendarDays}
                timeZone={studyStreak.timeZone}
              />
            ) : streakError ? (
              <LoadError>
                Couldn&apos;t load your activity. Refresh to try again.
              </LoadError>
            ) : (
              <p className="text-gray-500">Loading your activity…</p>
            ),
            saved: (
              <SavedList
                saved={savedItems}
                onRemove={(id) => void removeSaved(id)}
                limit={Infinity}
              />
            ),
            "in-progress": (
              <InProgressList
                inProgress={FIXTURE_IN_PROGRESS}
                inProgressReadings={FIXTURE_IN_PROGRESS_READINGS}
                limit={Infinity}
              />
            ),
            achievements: achievementError ? (
              <LoadError>
                Couldn&apos;t load your achievements. Refresh to try again.
              </LoadError>
            ) : (
              <AchievementsCard
                stats={achievementStats}
                earnedIds={earnedIds}
              />
            ),
            profile: (
              <TabPlaceholder title="Profile">
                Public profiles are coming soon. You can change your name, email
                and photo on your{" "}
                <Link href="/account" className="font-semibold underline">
                  account page
                </Link>
                .
              </TabPlaceholder>
            ),
          }}
        />
      </div>

      <Footer />
    </div>
  );
}
