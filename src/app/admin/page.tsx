"use client";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import APLibrary from "@/components/landingPage/APLibrary";
import { getUser } from "@/components/hooks/users";
import { User } from "@/types/user";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserManagement } from "./useUserManagement";

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();
  const { users, isLoading, handleRoleChange } = useUserManagement();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoadingUser) {
    return <div className="flex min-h-screen items-center justify-center text-3xl">Loading...</div>;
  }
  
  if (!user || user.access === "user") {
    router.push("/");
    return null; 
  }
 else {
    return (
      <div>
        <Navbar />

        <div className="mx-auto mt-12 flex max-w-6xl flex-col px-8 pb-8 ">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
              Admin dashboard
            </h1>

            {user.access === "admin" && (
            <>
              <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">Change the role of a user</p>
              <div className="mb-4">
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const selectedUser = users.find((u) => u.uid === e.target.value);
                    if (selectedUser) handleRoleChange(selectedUser);
                  }}
                >
                  <option value="">Select a user</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}


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
