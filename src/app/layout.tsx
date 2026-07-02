import "@/styles/globals.css";
import { type Metadata } from "next";
import { Figtree } from "next/font/google";
import RootLayoutClient from "./RootLayoutClient";
import { Toaster } from "@/components/ui/sonner";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fivehive.org"),
  title: {
    default: "FiveHive — Free AP Study Guides, Notes & Practice",
    template: "%s | FiveHive",
  },
  description:
    "Free AP study guides, unit notes, and practice questions written by AP students who scored 5s. Covering AP Biology, Chemistry, Calculus, US History, and more.",
  keywords: [
    "AP study guides",
    "AP notes",
    "AP exam prep",
    "AP practice questions",
    "free AP resources",
    "AP review",
  ],
  applicationName: "FiveHive",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "FiveHive",
    title: "FiveHive — Free AP Study Guides, Notes & Practice",
    description:
      "Free AP study guides, unit notes, and practice questions written by AP students. By AP students. For AP students.",
    url: "https://www.fivehive.org",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "FiveHive" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiveHive — Free AP Study Guides, Notes & Practice",
    description:
      "Free AP study guides, notes, and practice written by AP students.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              function setTheme(newTheme) {
                window.__theme = newTheme;
                if (newTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                document.documentElement.classList.remove('dark');
              }

              let theme;
              try {
                theme = localStorage.getItem('theme');
              } catch (err) { }

              window.__setTheme = function(newTheme) {
                theme = newTheme;
                setTheme(newTheme);
                try {
                  localStorage.setItem('theme', newTheme);
                } catch (err) { }
              };

              let initialTheme = theme;
              const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');

              if (!initialTheme) {
                initialTheme = themeQuery.matches ? 'dark' : 'light';
              }
              setTheme(initialTheme);

              themeQuery.addEventListener('change', function (e) {
                if (!theme) {
                  setTheme(e.matches ? 'dark' : 'light');
                }
              });
            })();
            `,
          }}
        />
        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster richColors />
      </body>
    </html>
  );
}
