"use client";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { getUser } from "@/components/hooks/users";
import { User } from "@/types/user";
import {
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useUserManagement } from "./useUserManagement";

const apClasses = [
  "AP 2-D Art and Design",
  "AP 3-D Art and Design",
  "AP Art History",
  "AP Biology",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Chemistry",
  "AP Chinese",
  "AP Comparative Government",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Drawing",
  "AP English Language",
  "AP English Literature",
  "AP Environmental Science",
  "AP European History",
  "AP French",
  "AP German",
  "AP Human Geography",
  "AP Italian",
  "AP Japanese",
  "AP Latin",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Music Theory",
  "AP Physics 1",
  "AP Physics 2",
  "AP Physics C: E&M",
  "AP Physics C: Mechanics",
  "AP Precalculus",
  "AP Psychology",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language",
  "AP Spanish Literature",
  "AP Statistics",
  "AP US History",
  "AP United States Government",
  "AP World History: Modern",
].sort();

const Page = () => {
  const [state, setState] = useState<{
    user: User | null;
    searchTermAPClasses: string;
    searchTermUsers: string;
  }>({
    user: null,
    searchTermAPClasses: "",
    searchTermUsers: "",
  });

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { users, handleRoleChange } = useUserManagement(); // Correctly call useUserManagement hook
  const router = useRouter();

  // Filter AP classes based on search term
  const filteredClasses = apClasses.filter((apClass) =>
    apClass.toLowerCase().includes(state.searchTermAPClasses.toLowerCase())
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser();
        setState((prevState) => ({
          ...prevState,
          user: fetchedUser,
        }));
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/");
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [router]);
  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }

  if (!state.user || state.user.access === "user") {
    router.push("/");
    return null;
  } else {
    return (
      <div>
        <Navbar />

        <div className="mx-auto mt-12 flex max-w-6xl flex-col px-8 pb-8 ">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
              Admin dashboard
            </h1>

            {state.user.access === "admin" && (
              <>
                <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
                  Change the role of a user
                </p>
                <div className="my-4 rounded-2xl border-2 p-4">
                  <div className="rounded-md bg-white p-4">
                    <input
                      type="text"
                      className="mb-3 w-full rounded-md border p-2"
                      placeholder="Search for a user..."
                      value={state.searchTermAPClasses}
                      onChange={(e) => setState((prevState) => ({
                        ...prevState,
                        searchTermUsers: e.target.value,
                      }))}
                    />
                    <ul className="class-list max-h-60 overflow-y-auto">
                      {users!.map((u) => (
                        <li
                          key={u.uid}
                          value={u.uid}
                          className="cursor-pointer rounded-md p-2 hover:bg-gray-200"
                          onClick={() => {
                            const selectedUser = users!.find(
                              (user) => user.uid === u.uid 
                            );
                            // if (selectedUser) handleRoleChange(selectedUser);
                          }}
                        >
                          ({u.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <p className="w-full text-pretty text-lg opacity-70 lg:text-xl">
              Select AP Class for Title
            </p>
            <div className="my-4 rounded-2xl border-2 p-4">
              <div className="rounded-md bg-white p-4">
                <input
                  type="text"
                  className="mb-3 w-full rounded-md border p-2"
                  placeholder="Search for a class..."
                  value={state.searchTermAPClasses}
                  onChange={(e) => setState((prevState) => ({
                    ...prevState,
                    searchTermAPClasses: e.target.value,
                  }))}
                />
                <ul className="class-list max-h-60 overflow-y-auto">
                  {filteredClasses.map((apClass: string) => (
                    <li
                      key={apClass}
                      className={`} cursor-pointer rounded-md p-2 hover:bg-gray-200`}
                      onClick={() =>
                        router.push(
                          `/admin/subject/${apClass
                            .replace(/AP /g, "")
                            .toLowerCase()
                            .replace(/[^a-z1-9 ]+/g, "")
                            .replace(/\s/g, "-")}`,
                        )
                      }
                    >
                      {apClass}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }
};
export default Page;
