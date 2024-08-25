"use client";

import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { User } from "@/types/user";
import { getUser } from "@/components/hooks/getUser";

const SignedInPfp = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user || error) return null;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleChangePfp = () => {
    console.log("user", user);
    console.log("Changing profile picture...");
  };

  return (
    <div className="relative">
      {/* Profile Picture */}
      <div className="flex items-center space-x-4">
        <span>{user.displayName}</span>
        <div onClick={toggleDropdown} className="relative cursor-pointer">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || user.email}
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
          {/* <div className="px-4 py-2 w-full">
            <span>{user.displayName || user.email}</span>
          </div>
          <hr className="border-gray-200" />
          <button
            onClick={handleChangePfp}
            className="block px-4 py-2 text-left hover:bg-gray-100 w-full"
          >
            Change Profile Picture
          </button>
          <hr className="border-gray-200" /> */}
          <button
            onClick={() => signOutUser()}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default SignedInPfp;

const signOutUser = () => {
  signOut(auth);
  window.location.reload();
};
