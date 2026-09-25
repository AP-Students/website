export default function GlobalStats({problemsSolved,subjectsCompleted,totalXp}: {problemsSolved: number, subjectsCompleted: number, totalXp: number }) {
  const rows = [
    { label: "Problems Solved", value: problemsSolved },
    { label: "Subjects Completed", value: subjectsCompleted },
    { label: "Total XP", value: totalXp },
  ];

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">Global Stats:</h2>

      <div className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3 font-semibold"
          >
            <span>{row.label}:</span>
            <span>{row.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
