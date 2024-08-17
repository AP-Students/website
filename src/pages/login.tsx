import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import { useAuthHandlers } from '@/lib/auth';
import React from "react";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function Login() {
  const { signInWithGoogle, signInWithDiscord } = useAuthHandlers();

  return (
    <div
      className={`${outfit.variable} flex min-h-screen items-center justify-center bg-primary-foreground font-sans`}
    >
      <div className="rounded-lg bg-destructive-foreground p-8 shadow-md">
        <h1 className="mb-8 text-4xl">Log in to FiveHive</h1>
        <div className="space-y-4">
          <Button onClick={signInWithGoogle}>Continue with Google</Button>
          <Button onClick={signInWithDiscord}>Continue with Discord</Button>
        </div>
      </div>
    </div>
  );
}

interface ButtonProps {
  children: string;
  onClick: () => void;
}

function Button({ children, onClick }: ButtonProps) {
  return (
    <div onClick={onClick} className="flex items-center justify-center w-full px-4 py-2 border border-gray-500 rounded-full hover:bg-primary-foreground transition-all duration-300">   
      <span className="font-semibold text-xl">{children}</span>
    </div>
  );
}
