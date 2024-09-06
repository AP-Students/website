"use client";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import APLibrary from "@/components/landingPage/APLibrary";
import { getUser } from "@/components/hooks/getUser";
import { User } from "@/types/user";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-3xl">Loading...</div>;
  }

  if (!user || !user.admin) {
    router.push("/");
  } else {
    return (
      <div>
        <Navbar />

        <div className="mx-auto mt-12 flex max-w-6xl flex-col px-8 pb-8 ">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
              Admin dashboard
            </h1>
            <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
              Click the subject you wish to add articles to
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 lg:gap-8">
            <APLibrary />
          </div>
        </div>

        <Footer />
      </div>
    );
  }
};
export default Page;
