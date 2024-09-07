"use client";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { getUser } from "@/components/hooks/users";
import { User } from "@/types/user";
import { useState, useEffect } from "react";
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); 
  const router = useRouter();

  // Filter AP classes based on search term
  const filteredClasses = apClasses.filter((apClass) =>
    apClass.toLowerCase().includes(state.searchTermAPClasses.toLowerCase()),
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

  const { users, handleRoleChange } = useUserManagement(state.user);

  const openModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

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
  }

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
              <p className="w-full text-pretty text-lg opacity-70 sm:text-lg lg:text-xl">
                Change the role of a user
              </p>
              <div className="my-4 rounded-2xl border-2 p-4">
                <div className="rounded-md bg-white p-4">
                  <input
                    type="text"
                    className="mb-3 w-full rounded-md border p-2"
                    placeholder="Search for a user..."
                    value={state.searchTermUsers}
                    onChange={(e) =>
                      setState((prevState) => ({
                        ...prevState,
                        searchTermUsers: e.target.value,
                      }))
                    }
                  />
                  <ul className="class-list max-h-60 overflow-y-auto">
                    {users!.map((u) => (
                      <li
                        key={u.uid}
                        className="grid cursor-pointer grid-cols-1 gap-4 rounded-md border p-4 text-center shadow-md hover:bg-gray-200 md:grid-cols-2 lg:grid-cols-3"
                        onClick={() => openModal(u)} // Open modal on click
                      >
                        <div className="hidden font-bold lg:block">
                          {u.displayName}
                        </div>
                        <div className="font-normal md:font-bold lg:font-normal">
                          {u.email}
                        </div>
                        <div className="font-bold">{u.access}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          <p className="w-full text-pretty text-lg opacity-70 sm:text-lg lg:text-xl">
            Select AP Class for Title
          </p>
          <div className="my-4 rounded-2xl border-2 p-4">
            <div className="rounded-md bg-white p-4">
              <input
                type="text"
                className="mb-3 w-full rounded-md border p-2"
                placeholder="Search for a class..."
                value={state.searchTermAPClasses}
                onChange={(e) =>
                  setState((prevState) => ({
                    ...prevState,
                    searchTermAPClasses: e.target.value,
                  }))
                }
              />
              <ul className="class-list max-h-60 overflow-y-auto">
                {filteredClasses.map((apClass: string) => (
                  <li
                    key={apClass}
                    className="cursor-pointer rounded-md p-2 hover:bg-gray-200"
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

      {/* Modal for Role Change */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-semibold">
              Change role for {selectedUser.displayName}
            </h3>
            <div className="flex justify-between space-x-4">
              <button
                className="rounded-lg bg-blue-500 p-2 text-white"
                onClick={() => {
                  handleRoleChange(selectedUser, "member");
                  closeModal();
                }}
              >
                Set to Member
              </button>
              <button
                className="rounded-lg bg-red-500 p-2 text-white"
                onClick={() => {
                  handleRoleChange(selectedUser, "user");
                  closeModal();
                }}
              >
                Set to User
              </button>
            </div>
            <button
              className="mt-4 text-gray-500 underline min-w-full text-center"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
