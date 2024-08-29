import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import { useAuthHandlers } from "@/lib/auth";
import React, { useState } from "react";
import { Button } from "./login";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function ForgotPassword() {
  const { forgotPassword } = useAuthHandlers();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const validateEmail = (email: string): boolean => {
    const errors: string[] = [];
    if (email.length === 0) {
      errors.push("Email is required.");
    }

    setErrors(errors);
    return errors.length === 0;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) return;
    setErrors([]); // Clear errors before sending the request
    setMessage(""); // Clear message before sending the request

    try {
      await forgotPassword(email);
      setMessage("If an account with that email exists, a password reset link has been sent.");
    } catch (error: any) {if (error.code === "auth/invalid-email") {
        setErrors(["Invalid email address."]);
      } else {
        setErrors(["An error occurred. Please try again later."]);
      }
    }
  };

  return (
    <div
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-destructive-foreground p-8 shadow-sm">
        <h1 className="mb-8 text-4xl">Forgot Password</h1>

        {errors.length > 0 && (
          <div className="mb-4 text-red-600">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {message && (
          <div className="mb-4 text-green-600">
            <p>{message}</p>
          </div>
        )}

        <div className="mb-10 space-y-4">
          <input
            type="text"
            placeholder="Enter your email"
            className="w-full rounded-full border border-gray-400 px-4 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div onClick={handleForgotPassword}>
            <Button className="text-xl font-semibold">Send</Button>
          </div>
        </div>

        <div className="flex justify-center text-black">
          <span className="pr-2">Remembered your password?</span>
          <Link className="hover:underline" href="/login">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
