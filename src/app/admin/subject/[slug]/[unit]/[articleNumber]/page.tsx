"use client";
import ArticleCreator from "@/app/article-creator/_components/ArticleCreator";
import { useUser } from "@/components/hooks/UserContext";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const Page = ({ params }: { params: { slug: string } }) => {
  const { user, loading } = useUser();

  const router = useRouter();
  const pathname = usePathname();

  // Using link to format unique title (eg, limits-and-continuity-1)
  const pathParts = pathname.split("/").slice(-2);
  const formattedTitle =
    `Lesson ${pathParts[1]?.charAt(0).toUpperCase() + pathParts[1]!.slice(1)} of ${pathParts[0]?.charAt(0).toUpperCase() + pathParts[0]!.slice(1)}`.replace(
      /-/g,
      " ",
    );
  useEffect(() => {
    if ((!user || user?.access === "user") && !loading) {
      router.push("/");
    }
  }, [user]);

  return (
    <div className="flex h-screen grow flex-col">
      <Navbar className="w-full px-10 xl:px-20" variant="secondary" />
      <div className="mt-[4rem] px-10 xl:px-20">
        <h1 className="pb-8 text-center text-5xl font-bold">
          {formattedTitle}
        </h1>
        <ArticleCreator className="mt-4" />
      </div>

      <Footer className="mx-0 mt-auto w-full max-w-none px-10 xl:px-20" />
    </div>
  );
};

export default Page;
