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
import { useEffect, useState } from "react";

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
    name: "Contribute",
    href: "/apply",
  },
];

const Navbar = ({
  hideLinks,
  className,
}: {
  hideLinks?: boolean;
  className?: string;
}) => {
  const { user } = useUser();

  const [atTopOfPage, setAtTopOfPage] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 0) {
        setAtTopOfPage(false);
      } else {
        setAtTopOfPage(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-40 hidden w-full items-center justify-between gap-4 bg-background py-2 transition-shadow md:flex",
          !atTopOfPage && "shadow-lg",
          className,
        )}
      >
        <div
          className={cn(
            "flex items-center pl-4 lg:grow lg:basis-0",
            hideLinks ? "pl-10 xl:pl-20" : "justify-center",
          )}
        >
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={80} height={80} />
            <h1 className="text-4xl font-bold">FiveHive</h1>
          </Link>
        </div>

        {!hideLinks && (
          <div className="flex max-w-lg grow justify-evenly">
            {links.map((link) => (
              <NavbarLink key={link.name} href={link.href}>
                {link.name}
              </NavbarLink>
            ))}
          </div>
        )}

        <div className="flex shrink-0 items-center justify-center gap-4 pr-8 lg:grow lg:basis-0">
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
          "flex w-full items-center justify-between py-2 pl-4 pr-6 md:hidden",
          className,
        )}
      >
        <Link className="flex items-center gap-2 sm:pl-6" href="/">
          <Image src="/logo.png" alt="Logo" width={80} height={80} />
          <h1 className="text-4xl font-bold">FiveHive</h1>
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
