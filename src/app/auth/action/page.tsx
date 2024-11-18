'use client';

import PasswordResetPage from "@/app/auth/reset";
import { redirect, useSearchParams } from "next/navigation";

// If you want this to take effect on your local app, you have to go to firebase -> auth -> templates -> edit -> customize action url -> "http://localhost:<port>/auth/action"
export default function ActionPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const code = searchParams.get("oobCode");
  if (!code) {
    alert("Unexpected error has occurred, please try again");
    return;
  }

  switch (mode) {
    case "resetPassword":
      return PasswordResetPage({ code });
      break;
    default:
      // This should never happen unless we configure firebase wrong
      // Right now since there is no email address verification, email address changing, or 2FA, the only possibility is password reset
      alert(
        "This mode is not supported please reach out to the development team",
      );
  }
}
