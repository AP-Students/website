'use client';

import PasswordResetPage from "@/app/auth/ResetPassword";
import { useSearchParams } from "next/navigation";

// If you want this to take effect on your local app, you have to go to firebase -> auth -> templates -> edit -> customize action url -> "http://localhost:<port>/auth/action"
export default function ActionPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const code = searchParams.get("oobCode");
  if (!code) {
    alert("Need an oobCode to access this page. If you don't know what that means just leave the page");
    return;
  }

  switch (mode) {
    case "resetPassword":
      return PasswordResetPage({ code });
    default:
      // This should never happen unless we configure firebase wrong
      // Right now since there is no email address verification, or 2FA, the only possibility is password reset
      alert(
        "This mode is not supported please reach out to the development team",
      );
  }
}
