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
import SearchBar from "./SearchBar";

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
          "sticky top-0 z-40 hidden w-full bg-background/95 py-2 backdrop-blur transition-shadow md:flex",
          !atTopOfPage && "shadow-lg",
          className,
        )}
      >
        <div className="mx-auto flex w-full max-w-[92rem] items-center gap-3 px-4 lg:gap-5 xl:px-8">
          <div
            className={cn(
              "flex shrink-0 items-center",
              hideLinks ? "pl-2 xl:pl-4" : "",
            )}
          >
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={72} height={72} />
              <h1 className="text-[2.1rem] font-bold leading-none">FiveHive</h1>
            </Link>
          </div>

          <div className={cn("min-w-0 grow", hideLinks ? "max-w-2xl" : "max-w-xl")}>
            <SearchBar />
          </div>

          {!hideLinks && (
            <div className="hidden shrink-0 items-center gap-6 lg:flex">
              {links.map((link) => (
                <NavbarLink key={link.name} href={link.href}>
                  {link.name}
                </NavbarLink>
              ))}
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center justify-center gap-4">
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

      <div className={cn("px-4 pb-3 md:hidden", className)}>
        <SearchBar mobile />
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
          <SearchBar mobile className="mt-2" />
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
