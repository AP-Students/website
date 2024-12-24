"use client";
import ArticleCreator from "@/components/article-creator/ArticleCreator";
import { useUser } from "@/components/hooks/UserContext";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, UserRoundCog } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Link } from "@/app/admin/subject/link";
import { cn } from "@/lib/utils";

const Page = () => {
  const { user, loading } = useUser();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathParts = pathname.split("/").slice(-4);

  useEffect(() => {
    if ((!user || user?.access === "user") && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  return (
    <div className="flex grow flex-col px-10 pt-10 xl:px-20">
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
        {decodeURIComponent(searchParams.get("subject") ?? "")}
        <br />
        {decodeURIComponent(searchParams.get("unit") ?? "")}
        <br />
        <b>{decodeURIComponent(searchParams.get("chapter") ?? "")}</b>
      </h1>
      <ArticleCreator className="mt-4 grow" />
    </div>
  );
};

export default Page;
