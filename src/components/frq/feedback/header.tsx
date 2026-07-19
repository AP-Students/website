import { LogOut } from "lucide-react";

export default function Header({
  earnedPoints,
  totalPoints,
}: {
  earnedPoints: number;
  totalPoints: number;
}) {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-center border-b-2 border-dashed border-gray-500 bg-white px-8">
      <p className="font-semibold">
        {earnedPoints}/{totalPoints} Points Earned
      </p>

      <button className="absolute right-8 flex items-center gap-2 font-semibold text-red-500">
        <LogOut className="size-5" />
        Return to Dashboard
      </button>
    </header>
  );
}
