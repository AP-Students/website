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

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl p-8 text-white lg:px-8">
      <div className="flex flex-col justify-between gap-y-6 sm:flex-row sm:items-center">
        <Link href={"/"}>
          <Image src={"/logo.svg"} alt="AProjectLogo" width={98} height={34} />
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
            >
              Discord
            </a>
          </li>
        </ul>
      </div>
      <hr className="mb-4 mt-[1.875rem] border-gray-300" />
      <h6 className="text-xs text-[#2E0F0FB2]">
        &copy; 2024 AP(roject)&trade;. All Rights Reserved.
      </h6>
    </footer>
  );
}
