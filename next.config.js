/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
  async redirects() {
    return [
      {
        source: "/lecture-feedback",
        destination: "https://bit.ly/fivehivelecturefeedback", // Replace with the actual Google Form/survey link
        permanent: false, // 'false' allows you to change the destination later without browser caching issues
      },
      // You can add more redirects like this:
      // {
      //   source: "/another-form",
      //   destination: "https://forms.gle/...",
      //   permanent: false,
      // },
    ];
  },
};

export default config;
