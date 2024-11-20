"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { applyActionCode } from "firebase/auth";
import { AuthError } from "firebase/auth";

interface UndoNewEmailProps {
  code: string;
}

const UndoNewEmail: React.FC<UndoNewEmailProps> = ({ code }) => {
  const [status, setStatus] = useState<string>("pending");
  const [message, setMessage] = useState<string>("");

  const handleUndo = async () => {
    try {
      await applyActionCode(auth, code);
      setStatus("success");
      setMessage("Email change has been reverted successfully.");
    } catch (error) {
      const firebaseError = error as AuthError;
      setStatus("error");
      setMessage(mapAuthError(firebaseError));
    }
  };

  const mapAuthError = (error: AuthError): string => {
    switch (error.code) {
      case "auth/invalid-action-code":
        return "The action code is invalid or has expired.";
      case "auth/user-disabled":
        return "The user corresponding to the action code has been disabled.";
      case "auth/user-not-found":
        return "No user found for this action code.";
      default:
        return "An error occurred while reverting the email change.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md rounded bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-semibold">Undo Email Change</h2>
        {status === "pending" && (
          <>
            <p className="mb-4">Do you want to undo your recent email change?</p>
            <button
              onClick={handleUndo}
              className="w-full px-4 py-2 bg-red-600 text-white rounded"
            >
              Undo Email Change
            </button>
          </>
        )}
        {status === "success" && (
          <div className="text-green-600">{message}</div>
        )}
        {status === "error" && (
          <div className="text-red-600">{message}</div>
        )}
      </div>
    </div>
  );
};

export default UndoNewEmail;
