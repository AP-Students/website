"use client"
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import { useUser } from "@/components/hooks/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ExperienceCard from "@/components/dashboard/ExperienceCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MyClasses from "@/components/dashboard/MyClasses"
import GlobalStats from "@/components/dashboard/GlobalStats";
import type { DashboardStats } from "@/types/dashboard";
import StreakBar from "@/components/dashboard/StreakBar";
import { toDateKey } from "@/lib/dashboard/dates"

const daysAgo = (n: number) => {
  const d = new Date();
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - n));
};

const MOCK_ACTIVE_DAYS = [0, 1, 2, 3, 4, 7, 9, 15, 16, 30, 33].map(daysAgo);


// TEMPORARY: fake numbers until the real userStats exists (chunk 8)
const MOCK_STATS: DashboardStats = {
  totalXp: 12000,
  level: 51,
  xpIntoLevel: 4897,
  xpNeededForLevel: 7000,
  problemsSolved: 432,
  subjectsCompleted: 5,
  currentStreak: 5,
  lastActiveDay: daysAgo(0),
};


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
        <DashboardHeader user={user} />

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-8 py-10 md:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-8">
        <ExperienceCard
        level={MOCK_STATS.level}
        xpIntoLevel={MOCK_STATS.xpIntoLevel}
        xpNeededForLevel={MOCK_STATS.xpNeededForLevel}
        />
        <StreakBar
        currentStreak={MOCK_STATS.currentStreak}
        lastActiveDay={MOCK_STATS.lastActiveDay}
        activeDays={MOCK_ACTIVE_DAYS}
        />
        <GlobalStats
        problemsSolved={MOCK_STATS.problemsSolved}
        subjectsCompleted={MOCK_STATS.subjectsCompleted}
        totalXp={MOCK_STATS.totalXp}
        />
        <p>Recent Activity (placeholder)</p>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
            <p>Achievements (placeholder)</p>
            <MyClasses uid={user.uid} subjectSlugs={user.mySubjects ?? []} />
            <p>Saved Pages (placeholder)</p>
        </div>
        </div>

        <Footer />
    </div>
    );

  }
