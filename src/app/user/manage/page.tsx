// app/user/manage/page.tsx
"use client";

import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/login/submitButton";
import { getUser } from "@/components/hooks/users";
import { User } from "@/types/user";
import {
  updateDisplayName,
  updateEmailAddress,
  updatePhotoURL,
  updatePassword,
  deleteAccount,
} from "@/lib/manageUser";
import ReauthenticateModal from "@/components/auth/ReauthenticateModal";

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
  const [reauthModalOpen, setReauthModalOpen] = useState<boolean>(false);
  const [reauthAction, setReauthAction] = useState<"email" | "password" | "delete" | null>(null);

  // Temporary states to hold new values until reauthentication is successful
  const [tempEmail, setTempEmail] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");

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

    const displayName = (event.currentTarget.displayName.value as string).trim();
    if (!user) return;
    if (displayName === user.displayName) return;

    try {
      await updateDisplayName(user.uid, displayName);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, displayName } : prevUser
      );
      setSuccessMessage("Display name updated successfully.");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, displayName: error }));
    }
  };

  const handleUpdateEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const email = (event.currentTarget.email.value as string).trim();
    if (!user) return;
    if (email === user.email) return;

    // Store the new email temporarily
    setTempEmail(email);
    // Open reauthentication modal before proceeding
    setReauthAction("email");
    setReauthModalOpen(true);
  };

  const handleConfirmUpdateEmail = async () => {
    if (!user) return;

    try {
      await updateEmailAddress(user.uid, tempEmail);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, email: tempEmail } : prevUser
      );
      setSuccessMessage("Email updated successfully.");
      setTempEmail("");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, email: error }));
    }
  };

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const newPassword = (event.currentTarget.password.value as string).trim();
    if (!newPassword) {
      setErrors((prev) => ({ ...prev, password: "Password cannot be empty." }));
      return;
    }

    // Store the new password temporarily
    setTempPassword(newPassword);
    // Open reauthentication modal before proceeding
    setReauthAction("password");
    setReauthModalOpen(true);
  };

  const handleConfirmUpdatePassword = async () => {
    try {
      await updatePassword(tempPassword);
      setSuccessMessage("Password updated successfully.");
      setTempPassword("");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, password: error }));
    }
  };

  const handleUpdatePhotoURL = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const photoURL = (event.currentTarget.photoURL.value as string).trim();
    if (!user) return;
    if (photoURL === user.photoURL) return;

    try {
      await updatePhotoURL(user.uid, photoURL);
      setUser((prevUser) => (prevUser ? { ...prevUser, photoURL } : prevUser));
      setPhotoPreview(photoURL);
      setSuccessMessage("Photo URL updated successfully.");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, photoURL: error }));
    }
  };

  const handleDeleteAccount = async () => {
    setErrors({});
    setSuccessMessage(null);

    // Open reauthentication modal before proceeding
    setReauthAction("delete");
    setReauthModalOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      // Redirect to "/login"
      router.push("/login");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, general: error }));
    }
  };

  const closeReauthModal = () => {
    setReauthModalOpen(false);
    setReauthAction(null);
    setTempEmail("");
    setTempPassword("");
  };

  const onReauthSuccess = () => {
    if (!reauthAction) return;

    if (reauthAction === "email" && tempEmail) {
      handleConfirmUpdateEmail();
    } else if (reauthAction === "password" && tempPassword) {
      handleConfirmUpdatePassword();
    } else if (reauthAction === "delete") {
      handleConfirmDeleteAccount();
    }
  };

  useEffect(() => {
    if (reauthAction) {
      setReauthModalOpen(true);
    }
  }, [reauthAction]);

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

  const accountType = user.createdWith === "google" ? "google" : "email";

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
              required
            />
            {errors.displayName && (
              <span className="text-sm text-red-600">{errors.displayName}</span>
            )}
            <Button className="self-end text-sm font-semibold" type="submit">
              Save Changes
            </Button>
          </form>

          {/* Email */}
          {accountType === "email" && (
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
                required
              />
              {errors.email && (
                <span className="text-sm text-red-600">{errors.email}</span>
              )}
              <Button className="self-end text-sm font-semibold" type="submit">
                Save Changes
              </Button>
            </form>
          )}

          {/* Password */}
          {accountType === "email" && (
            <form
              className="flex flex-col space-y-2"
              onSubmit={handleUpdatePassword}
            >
              <label className="text-sm font-semibold text-gray-600">
                New Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter new password"
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                required
              />
              {errors.password && (
                <span className="text-sm text-red-600">{errors.password}</span>
              )}
              <Button className="self-end text-sm font-semibold" type="submit">
                Save Changes
              </Button>
            </form>
          )}

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
              required
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

          {/* Delete Account */}
          <div className="mt-8">
            <h2 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h2>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Account
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Reauthentication Modal */}
      {reauthAction && (
        <ReauthenticateModal
          isOpen={reauthModalOpen}
          onClose={closeReauthModal}
          onSuccess={onReauthSuccess}
          accountType={accountType}
        />
      )}
    </div>
  );
}
