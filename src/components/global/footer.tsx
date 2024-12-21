import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const links = [
  {
    title: "About",
    url: "/",
  },
  {
    title: "Privacy Policy",
    url: "/",
  },
  {
    title: "Copyright",
    url: "/",
  },
];

export default function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn("mx-auto max-w-6xl p-8 text-white lg:px-8", className)}
    >
      <div className="flex flex-col justify-between gap-y-6 sm:flex-row sm:items-center">
        <Link href={"/"}>
          <Image src={"/logo.png"} alt="FiveHive logo" width={98} height={34} />
        </Link>

        <ul className="flex flex-col gap-6 sm:flex-row">
          {links.map((link) => (
            <li key={link.title}>
              <Link
                href={link.url}
                className="text-[#2E0F0FB2] hover:underline"
              >
                {link.title}
              </Link>
            </li>
          ))}
          <li>
            <a
              href="https://discord.com/invite/apstudents"
              className="text-[#2E0F0FB2] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
          </li>
        </ul>
      </div>
      <div className="my-6 text-center text-sm text-[#2E0F0FB2]">
        This is a demo.{" "}
        <Link
          href="https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s"
          className="font-bold text-blue-500 hover:underline"
        >
          Apply here
        </Link>{" "}
        to join the team and help us out!
      </div>
      <hr className="mb-4 mt-[1.875rem] border-gray-300" />
      <h6 className="text-xs text-[#2E0F0FB2]">
        &copy; 2024 FiveHive&trade;. All Rights Reserved.
      </h6>
    </footer>
  );
}
