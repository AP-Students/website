export default function ExperienceCard() {
//place holder values
  const level = 51;
  const xpToNextLevel = 2103;
  const progressPercent = 70;

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
              {xpToNextLevel} XP until level {level + 1}
            </p>
          </div>
        </div>


        <div className="p-3">
          <div className="h-4 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
