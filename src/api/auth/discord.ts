import { NextApiRequest, NextApiResponse } from "next";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI!,
  )}&response_type=code&scope=identify email`;
  res.redirect(url);
}
