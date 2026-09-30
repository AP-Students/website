"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import "@/styles/globals.css";
import React, {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/login/submitButton";
import { clearUserCache, getUser } from "@/components/hooks/users";
import type { User } from "@/types/user";
import {
  updateDisplayName,
  updatePassword,
  deleteAccount,
  uploadProfilePhoto,
} from "@/lib/manageUser";
import ReauthenticateModal from "@/components/auth/ReauthenticateModal";
import { useUser } from "@/components/hooks/UserContext";
import { ArrowLeft, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

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
  const { updateUser } = useUser();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [reauthModalOpen, setReauthModalOpen] = useState<boolean>(false);
  const [reauthAction, setReauthAction] = useState<
    "email" | "password" | "delete" | null
  >(null);

  const [tempPassword, setTempPassword] = useState<string>("");
  const photoObjectUrlRef = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const fetchedUser = await getUser();
        setUser(fetchedUser);
        setPhotoPreview(fetchedUser?.photoURL ?? "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    void fetchUser();

    return () => {
      if (photoObjectUrlRef.current) {
        URL.revokeObjectURL(photoObjectUrlRef.current);
      }
    };
  }, []);

  const handleUpdateDisplayName = async (event: FormEvent<ManagementForm>) => {
    event.preventDefault();
    setErrorMessage("");

    const displayName = event.currentTarget.displayName.value.trim();
    if (!user || !displayName || displayName === user.displayName) return;

    try {
      await updateDisplayName(user.uid, displayName);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, displayName } : prevUser,
      );

      clearUserCache();
      await updateUser();
      toast.success("Display name updated successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred.");
      }
    }
  };

  const handleUpdatePassword = async (event: FormEvent<ManagementForm>) => {
    event.preventDefault();
    setErrorMessage("");

    const newPassword = event.currentTarget.password.value.trim();
    if (!newPassword) {
      setErrorMessage("Password cannot be empty.");
      return;
    }

    setTempPassword(newPassword);
    // Open reauthentication modal before proceeding
    setReauthAction("password");
    setReauthModalOpen(true);
  };

  const handleConfirmUpdatePassword = async () => {
    try {
      await updatePassword(tempPassword);
      toast.success("Password updated successfully.");
      setTempPassword("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred.");
      }
    }
  };

  const handlePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");

    const file = event.currentTarget.files?.[0] ?? null;
    setPhotoFile(file);

    if (photoObjectUrlRef.current) {
      URL.revokeObjectURL(photoObjectUrlRef.current);
      photoObjectUrlRef.current = null;
    }

    if (!file) {
      setPhotoPreview(user?.photoURL ?? "");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    photoObjectUrlRef.current = objectUrl;
    setPhotoPreview(objectUrl);
  };

  const handleUploadPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!user) return;
    if (!photoFile) {
      setErrorMessage("Please choose an image first.");
      return;
    }

    setPhotoUploading(true);
    try {
      const photoURL = await uploadProfilePhoto(user.uid, photoFile);
      setUser((prevUser) => (prevUser ? { ...prevUser, photoURL } : prevUser));
      setPhotoPreview(photoURL);
      setPhotoFile(null);

      if (photoObjectUrlRef.current) {
        URL.revokeObjectURL(photoObjectUrlRef.current);
        photoObjectUrlRef.current = null;
      }

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      clearUserCache();
      await updateUser();
      toast.success("Profile picture updated successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred.");
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMessage("");

    // Open reauthentication modal before proceeding
    setReauthAction("delete");
    setReauthModalOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      clearUserCache();
      router.push("/login");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred.");
      }
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

  const currentPhoto = photoPreview ?? user?.photoURL ?? "";

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
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center py-6 sm:bg-primary-foreground">
      <div className="w-full max-w-xl rounded-lg border-primary bg-white p-8 sm:border sm:shadow-sm">
        <button
          onClick={() => {
            router.back();
          }}
          className="mb-6 flex gap-1 text-blue-500"
        >
          <ArrowLeft /> Back
        </button>
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          FiveHive Account
        </h1>
        <p className="mb-6 text-gray-600">Manage your account details below.</p>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
            {errorMessage}
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
              className="rounded-md border border-gray-300 px-3 py-2"
              required
            />
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
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <Button className="self-end text-sm font-semibold" type="submit">
                Save
              </Button>
            </form>
          )}

          {/* Profile Photo Upload */}
          <form
            className="flex flex-col space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
            onSubmit={handleUploadPhoto}
          >
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Profile Picture
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Upload a square image for the cleanest profile preview.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                {currentPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPhoto}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="block w-full cursor-pointer rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-yellow-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-yellow-700 hover:file:bg-yellow-100"
                />
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, or WEBP works best.
                </p>
              </div>
            </div>

            <Button
              className="self-end text-sm font-semibold"
              type="submit"
              disabled={photoUploading || !photoFile}
            >
              {photoUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </>
              )}
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
