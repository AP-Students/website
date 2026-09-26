"use client";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import { useUser } from "@/components/hooks/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  FIXTURE_SAVED,
  FIXTURE_IN_PROGRESS_READINGS,
  FIXTURE_NOTIFICATIONS,
} from "@/lib/dashboard/fixtures";
import AchievementsCard from "@/components/dashboard/AchievementsCard";
import { checkAchievements } from "@/lib/achievements/checkAchievements";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SavedAndInProgress from "@/components/dashboard/SavedAndInProgress";

// TEMPORARY: the fixtures pretend today is Sept 20, 2026. Remove this (and the
// `today` prop below) once the dashboard reads real data.
const FIXTURE_TODAY = new Date(2026, 8, 20);
// TEMPORARY: pretend the fixture user has earned everything their stats qualify
// for, until earned achievements are read from users/{uid}/achievements.
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

  if (loading || !user) {
    return <div>Loading…</div>;
  }
  return (
    <div>
      <Navbar />
      <DashboardHeader user={user} notifications={FIXTURE_NOTIFICATIONS} />

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
          <MyClasses uid={user.uid} subjectSlugs={user.mySubjects ?? []} />
          <SavedAndInProgress
            saved={FIXTURE_SAVED}
            inProgress={FIXTURE_IN_PROGRESS}
            inProgressReadings={FIXTURE_IN_PROGRESS_READINGS}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
