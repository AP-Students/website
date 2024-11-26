"use client";

import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { UserProvider, useUser } from "../hooks/UserContext";
import Image from "next/image";

const SignedInPfp = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useUser();

  if (!user) return null;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <UserProvider>
      <div className="relative">
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

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 max-w-48 whitespace-nowrap rounded-lg border border-gray-200 bg-white shadow-lg">

            {(user.access === "admin" || user.access === "member") && (
              <Link
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                href="/admin"
              >
                Admin Dashboard
              </Link>
            )}

            <button
              onClick={() => signOutUser()}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </UserProvider>
  );
};

export default SignedInPfp;

const signOutUser = async () => {
  try {
    await signOut(auth); 
    window.location.reload(); 
  } catch (error) {
    console.error("Error signing out:", error); 
  }
};
