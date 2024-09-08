"use client";
import ArticleCreator from "@/app/article-creator/_components/ArticleCreator";
import { getUser } from "@/components/hooks/users";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { db } from "@/lib/firebase";
import { Subject } from "@/types";
import { User } from "@/types/user";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const Page = ({ params }: { params: { slug: string } }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const pathParts = window.location.pathname.split("/").slice(-2);
  const formattedTitle = `Unit ${pathParts[1]?.charAt(0).toUpperCase() + pathParts[1]!.slice(1)}: ${pathParts[0]?.charAt(0).toUpperCase() + pathParts[0]!.slice(1)}`.replace(/-/g, " ");  

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
        setLoading(false);
      } catch (error) {
        setError("Error fetching user, please try again.");
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  return (
    <div className="relative flex grow flex-col">
      <Navbar className="w-full px-10 xl:px-20" variant="secondary" />

      <div className="relative flex grow flex-col">
        <div className="relative mt-[5.5rem] flex min-h-screen justify-between gap-x-16 px-10 xl:px-20">
          <div className="grow">
            <h1 className="flex justify-center py-8 text-5xl font-black">
              {formattedTitle}
            </h1>
            <ArticleCreator className="mt-4 grow" />
          </div>
        </div>

        <Footer className="mx-0 w-full max-w-none px-10 xl:px-20" />
      </div>
    </div>
  );
};

export default Page;
