"use client";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import type { User } from "@/types/user";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserManagement } from "./useUserManagement";
import apClassesData from "@/components/apClasses.json";
import { useUser } from "../../components/hooks/UserContext";
import Link from "next/link";
import { formatSlug } from "@/lib/utils";
import { PencilRuler, ShieldCheck, X } from "lucide-react";

const apClasses = apClassesData.apClasses;

const Page = () => {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-3xl">
        Authenticating user...
      </div>
    );
  }

  if (user.access === "user") {
    router.push("/");
    return null;
  }

  return (
    <div>
      <Navbar />

      <div className="mx-auto flex max-w-3xl flex-col p-8">
        <h1 className="text-5xl font-extrabold lg:text-6xl">Admin Dashboard</h1>

        {user.access === "admin" && <AdminPanel user={user} />}

        <SelectCourse />
      </div>

      <Footer />
    </div>
  );
};

function SelectCourse() {
  const [searchTermAPClasses, setSearchTermAPClasses] = useState<string>("");

  const filteredClasses = apClasses.filter((apClass) =>
    apClass.toLowerCase().includes(searchTermAPClasses.toLowerCase().trim()),
  );

  return (
    <>
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
        <ul className="class-list max-h-60 divide-y overflow-y-auto rounded-md border border-sky-300">
          {filteredClasses.map((apClass: string) => (
            <li key={apClass}>
              <Link
                className="block p-2 hover:bg-sky-100"
                href={`/admin/subject/${formatSlug(apClass.replace(/AP /g, ""))}`}
              >
                {apClass}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function AdminPanel({ user }: { user: User }) {
  // Users here is refering to the FiveHive users propagated in the changeUserRole (only seen by admins)
  const {
    users: initialUsers,
    error,
    handleRoleChange,
  } = useUserManagement(user);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTermUsers, setSearchTermUsers] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    if (dialogRef.current) dialogRef.current.showModal();
  };

  const closeDialog = () => {
    if (dialogRef.current) dialogRef.current.close();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.displayName
        .toLowerCase()
        .includes(searchTermUsers.toLowerCase().trim()) ||
      user.email.toLowerCase().includes(searchTermUsers.toLowerCase().trim()) ||
      user.access.toLowerCase().includes(searchTermUsers.toLowerCase().trim()),
  );

  return (
    <>
      <p className="w-full text-pretty text-lg opacity-70 sm:text-lg lg:text-xl">
        Change User Role
      </p>
      <div className="mb-4 rounded-lg border p-4 shadow-sm">
        <input
          type="text"
          className="mb-2 w-full rounded-md border p-2"
          placeholder="Find users by name, email, or role..."
          value={searchTermUsers}
          onChange={(e) => setSearchTermUsers(e.target.value)}
        />
        <div className="mb-2 flex gap-1 tabular-nums">
          <p>{filteredUsers.length} result(s):</p>
          <p>
            {filteredUsers.filter((u) => u.access === "admin").length} admin,{" "}
            {filteredUsers.filter((u) => u.access === "member").length} member,{" "}
            {filteredUsers.filter((u) => u.access === "user").length} user
          </p>
        </div>
        <ul className="class-list grid max-h-60 divide-y overflow-y-auto rounded-md border border-lime-300">
          {!error &&
            filteredUsers.map(
              // If error, it will show error message. Otherwise, it will show users
              (u) => (
                <li
                  key={u.uid}
                  className="grid cursor-pointer grid-cols-1 gap-x-4 p-2 text-center hover:bg-lime-100 md:grid-cols-3"
                  onClick={() => {
                    if (u.access === "admin") {
                      alert("Admins cannot demote other admins");
                      return;
                    } else {
                      setSelectedUser(u);
                      openDialog();
                    }
                  }}
                >
                  <p className="text-left font-bold">{u.displayName}</p>
                  <p>{u.email}</p>
                  <p className="font-bold">
                    {u.access}
                    {u.access === "admin" && (
                      <ShieldCheck className="ml-1 inline" />
                    )}
                    {u.access === "member" && (
                      <PencilRuler className="ml-1 inline" />
                    )}
                  </p>
                </li>
              ),
            )}
        </ul>
      </div>

      <dialog
        id="dialog"
        ref={dialogRef}
        className="rounded-lg border border-gray-400 p-4 pt-8 shadow-lg"
      >
        <button className="absolute right-1 top-1" onClick={closeDialog}>
          <X />
        </button>
        {selectedUser && (
          <>
            <h3 className="mb-4">
              Update role of {selectedUser.displayName} ({selectedUser.access})
            </h3>
            <div className="flex justify-between space-x-4">
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-white disabled:bg-gray-400"
                onClick={async () => {
                  try {
                    await handleRoleChange(selectedUser, "member");
                    setUsers((prev) =>
                      prev.map((user) =>
                        user.uid === selectedUser.uid
                          ? { ...user, access: "member" }
                          : user,
                      ),
                    );
                    closeDialog();
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
                    );
                  }
                }}
                disabled={selectedUser.access === "member"}
              >
                Set to Member
              </button>
              <button
                className="rounded-md bg-gray-600 px-4 py-2 text-white disabled:bg-gray-400"
                onClick={async () => {
                  try {
                    await handleRoleChange(selectedUser, "user");
                    setUsers((prev) =>
                      prev.map((user) =>
                        user.uid === selectedUser.uid
                          ? { ...user, access: "user" }
                          : user,
                      ),
                    );
                    closeDialog();
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
                    );
                  }
                }}
                disabled={selectedUser.access === "user"}
              >
                Set to User
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

export default Page;
