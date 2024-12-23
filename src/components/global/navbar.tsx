import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";

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
  {
    name: "Apply Here",
    href: "https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s/edit",
  },
];

const Navbar = ({
  variant = "primary",
  className,
}: {
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          "hidden w-full items-center justify-between pt-5 md:flex",
          className,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            variant === "primary" && "grow basis-0",
          )}
        >
          <Link href={"/"}>
            <Image src="/logo.png" alt="Logo" width={100} height={100} />
          </Link>
        </div>

        {variant === "primary" && (
          <div className="flex space-x-12">
            {links.map((link) => (
              <NavbarLink key={link.name} href={link.href}>
                {link.name}
              </NavbarLink>
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex items-center justify-center space-x-8",
            variant === "primary" && "grow basis-0",
          )}
        >
          <>
            <NavbarLink href={"/signup"}>Sign up</NavbarLink>

            <Link href={"/login"}>
              <Button className="text-md px-5 py-3 font-semibold text-white">
                Log in
              </Button>
            </Link>
          </>
        </div>
      </div>

      <div
        className={cn(
          "flex w-full items-center justify-between px-8 py-7 md:hidden",
          className,
        )}
      >
        <div className="flex items-center justify-center">
          <Link href={"/"}>
            <Image src="/logo.png" alt="Logo" width={75} height={75} />
          </Link>
        </div>

        <MobileNavbar />
      </div>

      {/* Unclosable Popup */}
      <div className="w-full bg-yellow-300 px-4 py-2 text-center text-yellow-900 shadow-md md:py-4 text-lg">
        <span className="text-sm font-semibold md:text-base">
          This is a demo.{" "}
          Check out an{" "}
          <Link
            href="/subject/music-theory"
            className="text-yellow-800 underline hover:text-yellow-700"
          >
            example subject.
          </Link>{" "}
          <Link
            href="https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s/edit"
            className="text-yellow-800 underline hover:text-yellow-700"
          >
            Apply here
          </Link>{" "}
          to join the team and help us out!
        </span>
      </div>
    </>
  );
};

const MobileNavbar = () => {
  return (
    <>
      <Sheet>
        <SheetTrigger>
          <MenuIcon className="opacity-70" />
        </SheetTrigger>
        <SheetContent className="bg-primary-foreground">
          <SheetHeader>
            <SheetTitle className="flex w-full">
              <SheetTrigger asChild>
                <Link className="inline-block" href={"/"}>
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={75 * 1.35}
                    height={80 * 1.35}
                  />
                </Link>
              </SheetTrigger>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-2">
            {links.map((link) => (
              <div key={link.name}>
                <SheetTrigger asChild>
                  <NavbarLink href={link.href} isMobile={true}>
                    {link.name}
                  </NavbarLink>
                </SheetTrigger>
              </div>
            ))}

            <>
              <div>
                <NavbarLink href={"/signup"} isMobile={true}>
                  Sign up
                </NavbarLink>
              </div>

              <Button className="text-md px-5 py-3 font-semibold text-white">
                <Link href={"/login"}>Log in</Link>
              </Button>
            </>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const NavbarLink = ({
  children,
  href,
  isMobile = false,
  className,
}: {
  children: React.ReactNode;
  href: string;
  isMobile?: boolean;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "capitalize opacity-70 transition-all ease-in-out hover:text-primary",
        !isMobile && "scale-100 hover:scale-105",
        className,
      )}
    >
      {children}
    </Link>
  );
};
export default Navbar;
