import "@/styles/globals.css";
import { Outfit } from "next/font/google";
import RootLayoutClient from "./RootLayoutClient";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "FiveHive",
  description: "By AP students. For AP students.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans`}>
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
      </body>
    </html>
  );
}
