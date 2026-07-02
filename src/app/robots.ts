import { type MetadataRoute } from "next";

const baseUrl = "https://www.fivehive.org";

// Authenticated / non-content areas that should not be crawled or cited.
const disallow = [
  "/admin",
  "/account",
  "/peer-grading",
  "/login",
  "/signup",
  "/auth",
  "/api",
];

// AI assistant crawlers we explicitly welcome so FiveHive can be cited in
// AI-generated answers. They inherit the same disallow list as everyone else.
const aiBots = [
  "GPTBot", // OpenAI / ChatGPT
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot", // Perplexity
  "ClaudeBot", // Anthropic / Claude
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended", // Gemini & Google AI Overviews
  "Bingbot", // Microsoft Copilot (via Bing)
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...aiBots.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
