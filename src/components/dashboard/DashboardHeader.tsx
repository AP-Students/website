import type { User } from "@/types/user";

export default function DashboardHeader({ user }: { user: User }) {
  return (
    <div className="border-b border-orange-200 bg-orange-50">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-8 py-10">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-gray-300" />
        )}

        <div>
          <h1 className="text-4xl font-extrabold">{user.displayName}</h1>
          <p className="text-gray-500">Subtitle goes here</p>
        </div>
      </div>
    </div>
  );
}
