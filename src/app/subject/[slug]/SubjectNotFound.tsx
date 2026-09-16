import Link from "next/link";

export default function SubjectNotFound() {
  return (
    <div className="flex min-h-screen w-full grow flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <p className="text-5xl font-bold">404</p>
        <h1 className="mt-3 text-2xl font-semibold">Topic not found</h1>
        <p className="mt-2 text-muted-foreground">
          This topic doesn&apos;t exist or the link is incorrect.
        </p>
        <Link href="/" className="mt-5 inline-block text-blue-600 hover:underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
