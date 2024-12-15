"use client";

import "@/styles/globals.css";
import React, { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/login/submitButton";
import { getUser } from "@/components/hooks/users";
import type { User } from "@/types/user";
import {
  updateDisplayName,
  updatePhotoURL,
  updatePassword,
  deleteAccount,
} from "@/lib/manageUser";
import ReauthenticateModal from "@/components/auth/ReauthenticateModal";
import Image from "next/image";

interface ManagementForm extends HTMLFormElement {
  displayName: {
    value: string;
  };
  password: {
    value: string;
  };
  photoURL: {
    value: string;
  };
}

export default function UserManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reauthModalOpen, setReauthModalOpen] = useState<boolean>(false);
  const [reauthAction, setReauthAction] = useState<
    "email" | "password" | "delete" | null
  >(null);

  const [tempPassword, setTempPassword] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
        setPhotoPreview(fetchedUser?.photoURL ?? "");
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to load user data. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    }
    void fetchUser();
  }, []);

  const handleUpdateDisplayName = async (event: FormEvent<ManagementForm>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const displayName = event.currentTarget.displayName.value.trim();
    if (!user) return;
    if (!displayName) return;
    if (displayName === user.displayName) return;

    try {
      await updateDisplayName(user.uid, displayName);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, displayName } : prevUser,
      );
      setSuccessMessage("Display name updated successfully.");
    } catch (error: unknown) {
      setErrors((prev) => ({ ...prev, displayName: error as string }));
    }
  };

  const handleUpdatePassword = async (event: FormEvent<ManagementForm>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const newPassword = event.currentTarget.password.value.trim();
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
    } catch (error: unknown) {
      setErrors((prev) => ({ ...prev, password: error as string }));
    }
  };

  const handleUpdatePhotoURL = async (event: FormEvent<ManagementForm>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const photoURL = event.currentTarget.photoURL.value.trim();
    if (!user) return;
    if (photoURL === user.photoURL) return;

    try {
      await updatePhotoURL(user.uid, photoURL);
      setUser((prevUser) => (prevUser ? { ...prevUser, photoURL } : prevUser));
      setPhotoPreview(photoURL);
      setSuccessMessage("Photo URL updated successfully.");
    } catch (error: unknown) {
      setErrors((prev) => ({ ...prev, photoURL: error as string }));
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
    } catch (error: unknown) {
      setErrors((prev) => ({ ...prev, general: error as string }));
    }
  };

  const closeReauthModal = () => {
    setReauthModalOpen(false);
    setReauthAction(null);
    setTempPassword("");
  };

  const onReauthSuccess = async () => {
    if (!reauthAction) return;

    if (reauthAction === "password" && tempPassword) {
      await handleConfirmUpdatePassword();
    } else if (reauthAction === "delete") {
      await handleConfirmDeleteAccount();
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
      className={`flex min-h-screen items-center justify-center bg-primary-foreground`}
    >
      <div className="w-full max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-500 hover:underline"
        >
          ← Back
        </button>
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          FiveHive Account
        </h1>
        <p className="mb-8 text-gray-600">
          Manage your account details below. Click &quot;Save Changes&quot; to
          update.
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
              Save
            </Button>
          </form>

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
                Save
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
            {photoPreview && (
              <Image
                src={photoPreview}
                width={96}
                height={96}
                alt="Profile Preview"
                className="rounded-full"
              />
            )}
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
            <Button className="self-end text-sm font-semibold" type="submit">
              Save
            </Button>
          </form>

          {/* Delete Account */}
          <div className="mt-8">
            <h2 className="mb-2 text-lg font-semibold text-red-600">
              Danger Zone
            </h2>
            <button
              onClick={handleDeleteAccount}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Delete Account
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone. All your data will be permanently
              deleted.
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
