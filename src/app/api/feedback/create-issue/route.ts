import { type NextRequest } from "next/server";
import { env } from "@/env.js";
import { localFirebase } from "@/lib/firebase-routing";
import { createFeedbackIssue } from "@/lib/feedback/createIssue";

export async function POST(req: NextRequest) {
  return createFeedbackIssue(req, {
    localFirebase,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    credentials: env,
    fetch,
  });
}
