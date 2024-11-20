"use client";

import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import { useAuthHandlers } from "@/lib/auth";
import React, { type FormEvent, useState } from "react";
import Button from "@/components/login/submitButton";
import { FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

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
    } catch (e: any) {
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
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
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
              {showPassword ? ShowPassword() : HidePassword()}
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
          <Link className="hover:underline" href="/signup">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}

function HidePassword() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function ShowPassword() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}
