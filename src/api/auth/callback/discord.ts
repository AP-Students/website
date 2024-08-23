// src/pages/api/auth/callback/discord.ts
import { type NextApiRequest, type NextApiResponse } from 'next';
import axios from 'axios';
import { env } from "@/env.js"

const DISCORD_CLIENT_ID = env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = env.REDIRECT_URI;

interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: boolean;
  accent_color?: number;
  locale?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
  avatar_decoration_data?: {
    asset: string;
    sku_id: string;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send('Authorization code is required.');
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = tokenResponse.data as { access_token: string };

    const userResponse = await axios.get<DiscordUserResponse>('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const user = userResponse.data;

    // Instead of redirecting here, return the user data
    res.status(200).json(user);

  } catch (error) {
    console.error('Error during Discord OAuth2:', error);
    res.status(500).send('An error occurred during Discord OAuth2.');
  }
}
