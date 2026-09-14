import fs from "fs";
import path from "path";
import { type Metadata } from "next";
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";

// Unlisted page for Google Workspace nonprofit verification. It is kept out of
// the sitemap and navigation and marked noindex. It is deliberately NOT added
// to robots.txt: a Disallow entry would publish the URL and stop crawlers from
// ever seeing the noindex tag.
export const metadata: Metadata = {
  title: "Nonprofit Verification",
  alternates: { canonical: "/verifynpo" },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

// Verbatim content required for verification — do not reword.
const lines = [
  "Director: Lance Xu",
  "Personal Email: lancexu2014@gmail.com",
  "FiveHive Organizational Admin Email: lance@fivehive.org",
  "EIN: 42-4671408",
  "Address: 306 W Redwood St Ste 201, Baltimore, MD, 21201",
];

const imagePath = "/verifynpo/verification.png";

export default function VerifyNpoPage() {
  // Checked at build time so the page never ships a broken image icon.
  const hasImage = fs.existsSync(path.join(process.cwd(), "public", imagePath));

  return (
    <>
      <Navbar className="bg-primary-foreground" />

      <main className="min-h-screen bg-background py-16">
        <article className="mx-auto max-w-4xl space-y-8 px-6 lg:px-8">
          <div className="space-y-2 text-lg">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          {hasImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePath}
              alt="FiveHive nonprofit verification document"
              className="max-w-full rounded-md border"
            />
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
