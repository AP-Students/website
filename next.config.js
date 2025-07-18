/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// Skip env validation if explicitly requested or if we're in a CI environment without Firebase
if (!process.env.SKIP_ENV_VALIDATION && !process.env.CI) {
  await import("./src/env.js");
}

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
};

export default config;
