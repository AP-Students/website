"use client";

import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import { useAuthHandlers } from "@/lib/auth";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/login/submitButton";
import type { FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function Login() {
  const { signInWithGoogle, signInWithEmail } = useAuthHandlers();
  
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
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
    const password = formObject.password as string;

    const tempErrors: string[] = [];

    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      const error = e as FirebaseAuthError;
      switch (error.code) {
        case "auth/invalid-email":
          tempErrors.push(
            "Email doesn't exist. Please sign up to join FiveHive.",
          );
          break;
        case "auth/invalid-credential":
          tempErrors.push("Incorrect password.");
          break;
        case "auth/wrong-password":
          tempErrors.push("Incorrect password.");
          break;
        default:
          tempErrors.push(`An unexpected error occurred.`);
          break;
      }
    }

    setErrors(tempErrors);
    setLoading(false);
    return;
  };

  return (
    <div
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
    >
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-8 text-4xl">Log in to FiveHive</h1>

        {errors.length > 0 && (
          <div className="mb-4 text-red-600">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Email or username"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            id="email"
            name="email"
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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
              {showPassword ? <ShowPassword /> : <HidePassword />}
            </button>
          </div>
          <div className="text-right">
            <Link
              className="text-sm text-gray-400 hover:underline"
              href="/login/reset"
            >
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" className="text-xl font-semibold">
            {loading ? "Loading..." : "Log In"}
          </Button>
        </div>

        <div className="my-8 border-t border-gray-300"></div>

        <div className="space-y-4">
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
            onClick={signInWithGoogle}
            type="button"
          >
            Continue with Google
          </Button>
        </div>

        <div className="my-8"></div>

        <div className="flex justify-center text-black">
          <span className="pr-2">Don&apos;t have an account?</span>
          <Link className="hover:underline" href="/signup">
            Sign up
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
