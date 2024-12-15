"use client";
import ArticleCreator from "@/components/article-creator/ArticleCreator";
import { useUser } from "@/components/hooks/UserContext";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, UserRoundCog } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/app/admin/subject/link";
import { cn } from "@/lib/utils";

const Page = () => {
  const { user } = useUser();

  const router = useRouter();
  const pathname = usePathname();

  // Using link to format unique title (eg, limits-and-continuity-1)
  const pathParts = pathname.split("/").slice(-3);
  const formattedSubject = `SUBJECT: ${pathParts[0]}`.replace(/-/g, " ");
  const formattedUnit = `UNIT: ${pathParts[1]}`.replace(/-/g, " ");
  const formattedLesson = `Lesson ${pathParts[2]}`;

  if(!user) {
    return <div className="flex h-screen items-center justify-center text-3xl"> Authenticating user </div>;
  }

  if (user.access === "user") {
    router.push("/");
    return null;
  }

  return (
    <div className="flex grow flex-col px-10 pt-20 xl:px-20">
      <div className="flex flex-col gap-2">
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-min")}
          href={`/admin`}
        >
          <UserRoundCog className="mr-2" />
          Return to Admin Dashboard
        </Link>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-min")}
          href={`/admin/subject/${pathParts[0]}`}
        >
          <ArrowLeft className="mr-2" />
          Return to Subject
        </Link>
      </div>
      <h1 className="py-8 text-2xl capitalize">
        {formattedSubject}
        <br />
        {formattedUnit}
        <br />
        <span className="text-4xl font-bold">{formattedLesson}</span>
      </h1>
      <ArticleCreator className="mt-4 grow" />
    </div>
  );
};

export default Page;
