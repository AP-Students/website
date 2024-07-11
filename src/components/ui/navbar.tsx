import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";
import { cn } from "@/lib/utils";
const links = [
  {
    name: "library",
    href: "/library",
  },
  {
    name: "guides",
    href: "/guides",
  },
  {
    name: "practice",
    href: "/practice",
  },
];

const Navbar = () => {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex grow basis-0 items-center justify-center">
        <Link href={"/"}>
          <Image src="/logo.svg" alt="Logo" width={100} height={120} />
        </Link>
      </div>

      <div className="flex space-x-12">
        {links.map((link) => (
          <NavbarLink key={link.name} href={link.href}>
            {link.name}
          </NavbarLink>
        ))}
      </div>

      <div className="flex grow basis-0 items-center justify-center space-x-8">
        <NavbarLink href="/discord">Discord</NavbarLink>

        <Button className="px-5 py-3 text-lg font-semibold text-white">
          <Link href={"/signup"}>Sign up</Link>
        </Button>
      </div>
    </div>
  );
};

const NavbarLink = ({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "scale-100 capitalize opacity-70 transition-all ease-in-out hover:scale-105 hover:opacity-100",
        className,
      )}
    >
      {children}
    </Link>
  );
};
export default Navbar;
