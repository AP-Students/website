"use client";

import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import { useAuthHandlers } from "@/lib/auth";
import React, { type FormEvent, useState } from "react";
import Link from "next/link";
import Button from "@/components/login/submitButton";
import { FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function Signup() {
  const { signInWithGoogle, signUpWithGoogle, signUpWithEmail  } = useAuthHandlers();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Stop default submission effect

    const tempErrors = [];
    setErrors([]); // Clear old errors

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
      await signUpWithEmail(
        formObject.username as string,
        formObject.email as string,
        formObject.password as string,
      );
    } catch (e: any) {
      const error = e as FirebaseAuthError;
      switch (error.code) {
        case "auth/email-already-in-use":
          tempErrors.push("Account with this email already exists.");
          break;
        case "auth/invalid-email":
          tempErrors.push("The email is invalid.");
          break;
        case "auth/operation-not-allowed":
          tempErrors.push(
            "This operation was not allowed by firebase, something is wrong with the firebase app.",
          );
          break;
        case "auth/weak-password":
          tempErrors.push("Your password is not strong enough.");
          break;
        default:
          errors.push(`An unexpected error occurred.`);
          break;
      }
      setErrors(tempErrors);
      console.error(errors);
    }
    setLoading(false);
  };

  return (
    <div
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
    >
      <form
        onSubmit={handleSignUp}
        className="w-full max-w-md rounded-2xl border border-gray-300 bg-destructive-foreground p-8 shadow-sm"
      >
        <h1 className="mb-8 text-4xl">Sign up for FiveHive</h1>

        {errors.length > 0 && (
          <div className="mb-4 text-red-500">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <div className="mb-10 space-y-4">
          <input
            type="text"
            placeholder="What should we call you?"
            className="w-full rounded-full border border-gray-400 px-4 py-2"
            id="username"
            name="username"
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-full border border-gray-400 px-4 py-2"
            id="email"
            name="email"
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-full border border-gray-400 px-4 py-2"
              id="password"
              name="password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? ShowPassword() : HidePassword()}
            </button>
          </div>

          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full rounded-full border border-gray-400 px-4 py-2"
              id="confirmPassword"
              name="confirmPassword"
              required
            />
          </div>
          <Button className="text-xl font-semibold" type="submit">
            {loading ? "Loading..." : "Sign up"}
          </Button>
        </div>

        <div className="my-6 border-t border-gray-400"></div>

        <div className="mt-8 space-y-4">
          <Button
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="25"
                height="25"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                ></path>
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                ></path>
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
              </svg>
            }
            className="text-xl"
            onClick={signUpWithGoogle}
            type="button"
          >
            Sign up with Google
          </Button>
        </div>

        <div className="my-8"></div>

        <div className="flex justify-center text-black">
          <span className="pr-2">Already have an account?</span>
          <Link className="hover:underline" href="/login">
            Log in
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
