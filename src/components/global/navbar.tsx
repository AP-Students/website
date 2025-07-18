"use client";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import SignedInPfp from "../login/SignedInPfp";
import { useUser } from "../hooks/UserContext";

const links = [
  {
    name: "library",
    href: "/library",
  },
  {
    name: "Practice",
    href: "/peer-grading",
  },
  {
    name: "guides",
    href: "/guides",
  },
  {
    name: "Team",
    href: "/team",
  },
  {
    name: "Contribute",
    href: "/apply",
  },
];

const Navbar = ({
  variant = "primary",
  className,
}: {
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  const { user } = useUser();

  return (
    <>
      <div
        className={cn(
          "hidden w-full items-center justify-between gap-4 pt-5 md:flex",
          className,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            variant === "primary" && "grow basis-0",
          )}
        >
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={100} height={100} />
            <h1 className="text-4xl font-bold">FiveHive</h1>
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
          {user ? (
            <SignedInPfp />
          ) : (
            <>
              <NavbarLink href="/signup">Sign up</NavbarLink>

              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "text-md px-5 font-semibold",
                )}
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex w-full items-center justify-between px-8 pt-7 md:hidden",
          className,
        )}
      >
        <Link className="flex items-center gap-2" href="/">
          <Image src="/logo.png" alt="Logo" width={75} height={75} />
          <h1 className="text-3xl font-bold">FiveHive</h1>
        </Link>

        <MobileNavbar />
      </div>
    </>
  );
};

const MobileNavbar = () => {
  const { user } = useUser();

  return (
    <>
      <Sheet>
        <SheetTrigger>
          <MenuIcon className="opacity-70" />
        </SheetTrigger>
        <SheetContent className="flex flex-col bg-primary-foreground">
          <SheetHeader>
            <SheetTitle className="flex w-full">
              <SheetTrigger asChild>
                <Link className="flex items-center gap-2" href={"/"}>
                  <Image src="/logo.png" alt="Logo" width={75} height={75} />
                  <h1 className="text-3xl font-bold">FiveHive</h1>
                </Link>
              </SheetTrigger>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex grow flex-col gap-2">
            {links.map((link) => (
              <div key={link.name}>
                <SheetTrigger asChild>
                  <NavbarLink href={link.href} isMobile={true}>
                    {link.name}
                  </NavbarLink>
                </SheetTrigger>
              </div>
            ))}

            {user ? (
              <SignedInPfp mobile />
            ) : (
              <>
                <Link
                  href="/signup"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "default" })}
                >
                  Log in
                </Link>
              </>
            )}
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
