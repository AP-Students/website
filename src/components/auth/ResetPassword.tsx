"use client";

import "@/styles/globals.css";
import { useAuthHandlers } from "@/lib/auth";
import React, { type FormEvent, useState } from "react";
import Button from "@/components/login/submitButton";
import type { FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";
import Link from "next/link";
import { Eye, EyeClosed } from "lucide-react";

export default function PasswordResetPage({ code }: { code: string }) {
  const { resetPassword } = useAuthHandlers();

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Stop default submission effect

    const tempErrors: string[] = [];
    setErrors([]); // Clear old errors

    if (!code) {
      setErrors(["The reset code is missing. Please try again."]);
      return;
    }

    const formEle = event.currentTarget;
    const formData = new FormData(formEle);

    if (!formEle.checkValidity()) {
      formEle.reportValidity();
      return;
    }

    const formObject: Record<string, unknown> = {};
    for (const [k, v] of formData) {
      formObject[k] = v;
    }

    const password = formObject.password as string;
    const confirmPassword = formObject.confirmPassword as string;

    // Check password length
    if (password.length < 8) {
      tempErrors.push("Password must be at least 8 characters long.");
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      tempErrors.push("Passwords do not match.");
    }

    // Check for at least one special character and one number
    const specialCharRegex = /[!@#$%^&*]/;
    const numberRegex = /[0-9]/;

    if (!specialCharRegex.test(password)) {
      tempErrors.push(
        "Password must contain at least one special character (!@#$%^&*).",
      );
    }

    if (!numberRegex.test(password)) {
      tempErrors.push("Password must contain at least one number.");
    }

    if (tempErrors.length > 0) {
      setErrors(tempErrors);
      return;
    }

    setLoading(true);

    try {
      await resetPassword(password, code);
      alert(
        "Password reset successful. You can now log in with your new password.",
      );
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      switch (error.code) {
        case "auth/expired-action-code":
          tempErrors.push(
            "The password reset code has expired. Please request a new one.",
          );
          break;
        case "auth/invalid-action-code":
          tempErrors.push(
            "The password reset code is invalid or has already been used.",
          );
          break;
        case "auth/user-disabled":
          tempErrors.push(
            "The user associated with this password reset code has been disabled.",
          );
          break;
        case "auth/user-not-found":
          tempErrors.push(
            "No user found for this password reset code. The user may have been deleted.",
          );
          break;
        case "auth/weak-password":
          tempErrors.push("The new password is not strong enough.");
          break;
        default:
          tempErrors.push("An unexpected error occurred. Please try again.");
          break;
      }
      setErrors(tempErrors);
      console.error(error);
    }

    setErrors(tempErrors);
    setLoading(false);
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-primary-foreground`}
    >
      <form
        onSubmit={handlePasswordReset}
        className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-8 text-4xl">Reset Your Password</h1>

        {errors.length > 0 && (
          <div className="mb-4 text-red-500">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              id="password"
              name="password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-sm text-gray-400"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <Eye /> : <EyeClosed />}
            </button>
          </div>

          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              id="confirmPassword"
              name="confirmPassword"
              required
            />
          </div>
          <Button className="text-xl font-semibold" type="submit">
            {loading ? "Loading..." : "Reset Password"}
          </Button>
        </div>

        <div className="mt-8 flex justify-center">
          <Link className="hover:underline" href="/login">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
