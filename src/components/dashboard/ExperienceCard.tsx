export default function ExperienceCard({
  level,
  xpIntoLevel,
  xpForNextLevel,
  totalXp,
}: {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  /** Shown under the bar where no other card lists the total. */
  totalXp?: number;
}) {
  const xpRemaining = Math.max(0, xpForNextLevel - xpIntoLevel);
  const progressPercent =
    xpForNextLevel > 0
      ? Math.min(100, (xpIntoLevel / xpForNextLevel) * 100)
      : 0;

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">Experience:</h2>

      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
        <div className="flex items-center border-b border-gray-300">
          <div className="border-r border-gray-300 px-4 py-2 text-5xl">
            {level}
          </div>
          <div className="px-4 font-semibold">
            <p>Level {level}</p>
            <p>
              {xpRemaining.toLocaleString()} XP until level {level + 1}
            </p>
          </div>
        </div>

        <div className="p-3">
          <div
            className="h-4 w-full rounded-full bg-gray-200"
            role="progressbar"
            aria-label={`Progress to level ${level + 1}`}
            aria-valuemin={0}
            aria-valuemax={xpForNextLevel}
            aria-valuenow={xpIntoLevel}
          >
            <div
              className="h-full rounded-full bg-red-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {totalXp !== undefined && (
            <p className="mt-2 text-sm font-semibold text-gray-600">
              {totalXp.toLocaleString()} XP total
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
