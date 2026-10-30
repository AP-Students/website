import ExperienceCard from "@/components/dashboard/ExperienceCard";
import GlobalStats from "@/components/dashboard/GlobalStats";
import AchievementsCard from "@/components/dashboard/AchievementsCard";
import { levelForXp } from "@/lib/gamification/xp";
import { readAchievementStats } from "@/lib/achievements/checkAchievements";

export default function ProfileView({
  displayName,
  photoURL,
  xp,
  streak,
  problemsSolved,
  subjectsCompleted,
  earnedIds,
  nameAs: Name = "h2",
}: {
  displayName: string;
  photoURL?: string;
  xp: number;
  streak: number;
  problemsSolved: number;
  subjectsCompleted: number;
  earnedIds: ReadonlySet<string>;
  nameAs?: "h1" | "h2";
}) {
  const progress = levelForXp(xp);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-center gap-6">
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoURL}
            alt=""
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-gray-300" />
        )}
        <Name className="text-4xl font-extrabold">{displayName}</Name>
      </div>

      <ExperienceCard
        level={progress.level}
        xpIntoLevel={progress.xpIntoLevel}
        xpForNextLevel={progress.xpForNextLevel}
      />
      <GlobalStats
        streak={streak}
        problemsSolved={problemsSolved}
        subjectsCompleted={subjectsCompleted}
        totalXp={progress.xp}
      />
      <AchievementsCard
        stats={readAchievementStats(undefined)}
        earnedIds={earnedIds}
        earnedOnly
      />
    </div>
  );
}
