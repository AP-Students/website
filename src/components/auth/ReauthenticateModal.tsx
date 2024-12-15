"use client";

import React, { useState, type FormEvent, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  type AuthError,
} from "firebase/auth";

interface ReauthenticateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountType: "google" | "email";
}

const ReauthenticateModal: React.FC<ReauthenticateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountType,
}) => {
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Reset state when the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setError("No authenticated user found.");
      setLoading(false);
      return;
    }

    try {
      if (accountType === "email") {
        if (!password) {
          setError("Password is required for reauthentication.");
          setLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email ?? "", password);
        await reauthenticateWithCredential(user, credential);
      } else if (accountType === "google") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const firebaseError = err as AuthError;
      setError(mapAuthError(firebaseError));
    } finally {
      setLoading(false);
    }
  };

  const mapAuthError = (error: AuthError): string => {
    switch (error.code) {
      case "auth/invalid-password":
      case "auth/wrong-password":
        return "The password is incorrect.";
      case "auth/user-disabled":
        return "The user account has been disabled.";
      case "auth/user-not-found":
        return "No user found for this action.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "An error occurred during reauthentication.";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Reauthenticate</h2>
        {accountType === "email" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Reauthenticating..." : "Reauthenticate"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p>Please use Google to reauthenticate.</p>
            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Reauthenticating..." : "Reauthenticate with Google"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReauthenticateModal;
