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
  {
    title: "Discord",
    url: "/",
  },
];

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl p-8 text-white lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        <Link href={"/"}>
          <Image src={"/logo.svg"} alt="AProjectLogo" width={98} height={34} />
        </Link>

        <ul className="flex flex-wrap gap-6">
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
        </ul>
      </div>
      <hr className="mb-4 mt-[1.875rem] border-gray-300" />
      <h6 className="text-xs text-[#2E0F0FB2]">
        &copy; 2024 AP(roject)&trade;. All Rights Reserved.
      </h6>
    </footer>
  );
}
