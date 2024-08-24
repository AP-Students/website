import type { NextApiRequest, NextApiResponse } from "next";
import { addAdminRole } from "@/lib/manageRoles";
import { getErrorMessage } from "@/lib/handleError";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed" });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ message: "Missing user ID" });
  }

  try {
    const response = await addAdminRole(uid);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) });
  }
}
