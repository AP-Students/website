"use client";

import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { UserProvider, useUser } from "../hooks/UserContext";
import Image from "next/image";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

const SignedInPfp = ({ mobile }: { mobile?: boolean }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useUser();

  if (!user) return null;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className={cn("relative", mobile && "flex grow flex-col")}>
      {/* Profile Picture */}
      <div className="flex items-center space-x-4">
        <span>{user.displayName}</span>
        <div onClick={toggleDropdown} className="relative cursor-pointer">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || user.email}
              width={40}
              height={40}
              style={{ width: "40px", borderRadius: "50%" }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "gray",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "16px",
              }}
            ></div>
          )}
        </div>
      </div>

      {isDropdownOpen && !mobile && (
        <div className="absolute right-0 mt-2 max-w-48 overflow-hidden whitespace-nowrap rounded-lg border border-gray-300 bg-white shadow">
          {(user.access === "admin" || user.access === "member") && (
            <Link
              className="block w-full px-3 py-2 text-left transition-colors hover:bg-gray-100"
              href="/admin"
            >
              Admin Dashboard
            </Link>
          )}

          <Link
            href="/account"
            className="block w-full px-3 py-2 text-left transition-colors hover:bg-gray-100"
          >
            Account Settings
          </Link>

          <button
            onClick={signOutUser}
            className="block w-full px-3 py-2 text-left transition-colors hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}

      {mobile && (
        <div className="flex grow flex-col gap-4 py-4">
          {(user.access === "admin" || user.access === "member") && (
            <Link
              className={buttonVariants({ variant: "default" })}
              href="/admin"
            >
              Admin Dashboard
            </Link>
          )}

          <Link
            href="/account"
            className={buttonVariants({ variant: "default" })}
          >
            Account Settings
          </Link>

          <button
            onClick={signOutUser}
            className={cn(buttonVariants({ variant: "outline" }), "mt-auto")}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default SignedInPfp;

const signOutUser = async () => {
  try {
    await signOut(auth);

    // Clear cached user and timestamp from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("cachedUser");
      localStorage.removeItem("cacheUserTimestamp");
    }

    window.location.reload();
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
