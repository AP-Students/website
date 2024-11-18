"use client";

import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/login/submitButton";
import { getUser } from "@/components/hooks/users";
import { User } from "@/types/user";
import { updateDisplayName, updateEmailAddress, updatePhotoURL } from "@/lib/manageUser";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function UserManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [emailNeedsVerification, setEmailNeedsVerification] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
        setPhotoPreview(fetchedUser.photoURL || "");
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to load user data. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleUpdateDisplayName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const displayName = (event.target as any).displayName.value.trim();
    if (!user) return;
		if (displayName === user.displayName) return;

    try {
      await updateDisplayName(user.uid, displayName);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, displayName } : prevUser
      );
      setSuccessMessage("Display name updated successfully.");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, displayName: error?.message || "An error occurred." }));
    }
  };

  const handleUpdateEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const email = (event.target as any).email.value.trim();
    if (!user) return;
		if (email === user.email) return;

    try {
			setEmailNeedsVerification(true);
      await updateEmailAddress(user.uid, email);
      setUser((prevUser) => (prevUser ? { ...prevUser, email } : prevUser));
      setSuccessMessage("Email updated successfully.");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, email: error?.message || "An error occurred." }));
    } finally {
			setEmailNeedsVerification(false);
		}
  };

  const handleUpdatePhotoURL = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const photoURL = (event.target as any).photoURL.value.trim();
    if (!user) return;
		if (photoURL === user.photoURL) return;

    try {
      await updatePhotoURL(user.uid, photoURL);
      setUser((prevUser) => (prevUser ? { ...prevUser, photoURL } : prevUser));
      setPhotoPreview(photoURL);
      setSuccessMessage("Photo URL updated successfully.");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, photoURL: error?.message || "An error occurred." }));
    }
  };

  if (loading) {
    return <div className="text-center text-lg">Loading user data...</div>;
  }

  if (!user) {
    return (
      <div className="text-center text-lg text-red-500">
        Failed to load user data.
      </div>
    );
  }

  return (
    <div
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
    >
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-500 hover:underline"
        >
          ← Back
        </button>
        <h1 className="mb-6 text-3xl font-bold text-gray-800">User Management</h1>
        <p className="mb-8 text-gray-600">
          Manage your account details below. Click "Save Changes" to update.
        </p>

        {errors.general && (
          <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
            {errors.general}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Display Name */}
          <form
            className="flex flex-col space-y-2"
            onSubmit={handleUpdateDisplayName}
          >
            <label className="text-sm font-semibold text-gray-600">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              defaultValue={user.displayName}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
            />
            {errors.displayName && (
              <span className="text-sm text-red-600">{errors.displayName}</span>
            )}
            <Button className="self-end text-sm font-semibold" type="submit">
              Save Changes
            </Button>
          </form>

          {/* Email */}
          <form
            className="flex flex-col space-y-2"
            onSubmit={handleUpdateEmail}
          >
            <label className="text-sm font-semibold text-gray-600">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
            />
            {errors.email && (
              <span className="text-sm text-red-600">{errors.email}</span>
            )}
            <Button className="self-end text-sm font-semibold" type="submit">
              {emailNeedsVerification ? "Waiting for Verification..." : "Save Changes"}
            </Button>
          </form>

          {/* Photo URL */}
          <form
            className="flex flex-col space-y-2"
            onSubmit={handleUpdatePhotoURL}
          >
            <label className="text-sm font-semibold text-gray-600">
              Profile Picture URL
            </label>
            <input
              type="url"
              name="photoURL"
              defaultValue={user.photoURL}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
            />
            {errors.photoURL && (
              <span className="text-sm text-red-600">{errors.photoURL}</span>
            )}
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Profile Preview"
                className="mt-4 h-24 w-24 rounded-full border"
              />
            )}
            <Button className="self-end text-sm font-semibold" type="submit">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
