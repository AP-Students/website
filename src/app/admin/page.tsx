"use client";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import type { User } from "@/types/user";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserManagement } from "./useUserManagement";
import apClassesData from "@/components/apClasses.json";
import { useUser } from "../../components/hooks/UserContext";
import { formatSlug } from "@/lib/utils";

const apClasses = apClassesData.apClasses;

const Page = () => {
  const { user } = useUser();
  const [searchTermAPClasses, setSearchTermAPClasses] = useState<string>("");
  const [searchTermUsers, setSearchTermUsers] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  // Filter AP classes based on search term
  const filteredClasses = apClasses.filter((apClass) =>
    apClass.toLowerCase().includes(searchTermAPClasses.toLowerCase()),
  );

  // Users here is refering to the FiveHive users propagated in the changeUserRole (only seen by admins)
  const { users, error, handleRoleChange } = useUserManagement(user);

  const openModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  if (!user || user.access === "user") {
    router.push("/");
    return null;
  }

  return (
    <div>
      <Navbar />

      <div className="mx-auto mt-12 flex max-w-3xl flex-col px-8 pb-8 ">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-balance text-left text-5xl font-extrabold lg:text-6xl">
            Admin Dashboard
          </h1>

          {user.access === "admin" && (
            <>
              <p className="w-full text-pretty text-lg opacity-70 sm:text-lg lg:text-xl">
                Change User Role
              </p>
              <div className="mb-4 rounded-lg border p-4 shadow-sm">
                <input
                  type="text"
                  className="mb-3 w-full rounded-md border p-2"
                  placeholder="Search for a user..."
                  value={searchTermUsers}
                  onChange={(e) => setSearchTermUsers(e.target.value)}
                />
                <ul className="class-list max-h-60 overflow-y-auto">
                  {!error &&
                    users.map(
                      // If error, it will show error message. Otherwise, it will show users
                      (u) => (
                        <li
                          key={u.uid}
                          className="grid cursor-pointer grid-cols-1 gap-4 rounded-md border p-4 text-center shadow-md hover:bg-gray-200 md:grid-cols-2 lg:grid-cols-3"
                          onClick={() => {
                            if (u.access === "admin") {
                              alert("Admins cannot demote other admins");
                              return;
                            } else {
                              openModal(u);
                            }
                          }}
                        >
                          <div className="hidden font-bold lg:block">
                            {u.displayName}
                          </div>
                          <div className="font-normal md:font-bold lg:font-normal">
                            {u.email}
                          </div>
                          <div className="font-bold">{u.access}</div>
                        </li>
                      ),
                    )}
                </ul>
              </div>
            </>
          )}

          <p className="w-full text-pretty text-lg opacity-70 sm:text-lg lg:text-xl">
            Select AP Course
          </p>
          <div className="rounded-lg border p-4 shadow-sm">
            <input
              type="text"
              className="mb-3 w-full rounded-md border p-2"
              placeholder="Search for a class..."
              value={searchTermAPClasses}
              onChange={(e) => setSearchTermAPClasses(e.target.value)}
            />
            <ul className="class-list max-h-60 overflow-y-auto">
              {filteredClasses.map((apClass: string) => (
                <li
                  key={apClass}
                  className="cursor-pointer rounded-md p-2 hover:bg-gray-200"
                  onClick={() =>
                    router.push(
                      `/admin/subject/${formatSlug(
                        apClass.replace(/AP /g, ""),
                      )}`,
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
                onClick={async () => {
                  try {
                    await handleRoleChange(selectedUser, "member");
                    closeModal(); // Runs only after handleRoleChange succeeds
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
                    );
                  }
                }}
              >
                Set to Member
              </button>
              <button
                className="rounded-lg bg-red-500 p-2 text-white"
                onClick={async () => {
                  try {
                    await handleRoleChange(selectedUser, "member");
                    closeModal(); // Runs only after handleRoleChange succeeds
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
                    );
                  }
                }}
              >
                Set to User
              </button>
            </div>
            <button
              className="mt-4 min-w-full text-center text-gray-500 underline"
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
