import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "@/env.js";

const DISCORD_CLIENT_ID = env.DISCORD_CLIENT_ID;
const REDIRECT_URI = env.REDIRECT_URI;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
  )}&response_type=code&scope=identify email`;
  res.redirect(url);
}
