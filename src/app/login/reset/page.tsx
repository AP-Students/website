"use client";

import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import { useAuthHandlers } from "@/lib/auth";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/login/submitButton";
import { FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function Login() {
  const { forgotPassword } = useAuthHandlers();
  const [errors, setErrors] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors([]);

    const formEle = event.currentTarget;
    const formData = new FormData(event.currentTarget);

    if (!formEle.checkValidity()) {
      formEle.reportValidity();
      return;
    }

    const formObject: Record<string, unknown> = {};
    for (const [k, v] of formData) {
      formObject[k] = v;
    }

    const email = formObject.email as string;

    const tempErrors: string[] = [];

    try {
      await forgotPassword(email);
    } catch (e: any) {
      const error = e as FirebaseAuthError;
      switch (error.code) {
        case "auth/invalid-email":
          tempErrors.push("Email is invalid.");
          break;
        case "auth/user-not-found":
          tempErrors.push("No user with this email exists");
          break;
        default:
          tempErrors.push(`An unexpected error occurred. ${error.message}.`);
          break;
      }
    }
    setEmail(email);
    setEmailSent(true);
    setErrors(tempErrors);
    return;
  };

  return (
    <div
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
    >
      <form
        onSubmit={resetPassword}
        className="w-full max-w-md rounded-2xl border border-gray-300 bg-destructive-foreground p-8 shadow-sm"
      >
        <h1 className="mb-2 text-4xl">Reset Password</h1>

        {emailSent && (
          <h3 className="mb-6 mt-3 text-green-600">
            If user with email {email} exists, reset password link has been sent.
          </h3>
        )}

        {errors.length > 0 && (
          <div className="mb-4 text-red-600">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="mb-10 space-y-4">
          <input
            type="text"
            placeholder="Email or username"
            className="w-full rounded-full border border-gray-400 px-4 py-2"
            id="email"
            name="email"
            required
          />
          <Button type="submit" className="text-xl font-semibold">
            Reset Password
          </Button>
        </div>

        <div className="my-6 border-t border-gray-500"></div>

        <div className="flex justify-center text-black">
          <Link className="hover:underline" href="/login">
            Log In
          </Link>
        </div>

        <div className="my-2"></div>

        <div className="flex justify-center text-black">
          <span className="pr-2">Don't have an account?</span>
          <Link className="hover:underline" href="/signup">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}