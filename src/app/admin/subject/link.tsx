"use client";
import { startTransition } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserRoundCog } from "lucide-react";
import { useIsBlocked } from "@/app/admin/subject/navigation-block";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A custom Link component that wraps Next.js's next/link component.
 */
export function Link({
  href,
  children,
  replace,
  ...rest
}: Parameters<typeof NextLink>[0]) {
  const router = useRouter();
  const isBlocked = useIsBlocked();

  return (
    <NextLink
      href={href}
      onClick={(e) => {
        e.preventDefault();

        // Cancel navigation
        if (
          isBlocked &&
          !window.confirm(
            "Do you really want to leave and discard your unsaved changes?",
          )
        ) {
          return;
        }

        startTransition(() => {
          // Wont happen because href will always cast to a string
          /* eslint-disable-next-line */
          const url = href.toString();
          if (replace) {
            router.replace(url);
          } else {
            router.push(url);
          }
        });
      }}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

/**
 * The way out of a full-page admin editor: back to the subject, or all the way
 * to the dashboard.
 *
 * Shared because the FRQ editor needs exactly what the MCQ test editor already
 * had. The FRQ editor covers the viewport and renders no navbar, so before
 * these existed there was no in-app way out of it at all (#357) — and copying
 * the markup over would have meant two places to remember that the destructive
 * variant is what warns an author their edits are unsaved.
 *
 * `layout` is the only thing the two callers disagree about: the test editor
 * stacks full-width labels above its form, the FRQ editor sits them inline in a
 * fixed 64px header where only the shorter labels fit.
 */
export function AdminEditorBackLinks({
  subjectSlug,
  unsavedChanges,
  layout = "stacked",
}: {
  subjectSlug: string;
  unsavedChanges: boolean;
  layout?: "stacked" | "inline";
}) {
  const inline = layout === "inline";

  // Destructive doubles as the unsaved-changes warning, which is why it is
  // derived here rather than passed in: both editors must agree on it.
  const linkClass = cn(
    buttonVariants({ variant: unsavedChanges ? "destructive" : "outline" }),
    inline ? "shrink-0" : "w-min",
  );

  const subjectLink = (
    <Link
      href={`/admin/subject/${subjectSlug}`}
      className={linkClass}
      title="Return to this subject's units"
    >
      <ArrowLeft className="mr-2 size-4" />
      {inline ? "Subject" : "Return to Subject"}
    </Link>
  );

  const adminLink = (
    <Link
      href="/admin"
      // The dashboard is the redundant one of the pair, so it is what gives way
      // when an inline header runs out of room on a phone.
      className={cn(linkClass, inline && "hidden sm:inline-flex")}
      title="Return to the admin dashboard"
    >
      <UserRoundCog className="mr-2 size-4" />
      {inline ? "Admin" : "Return to Admin Dashboard"}
    </Link>
  );

  return (
    <div className={inline ? "flex items-center gap-3" : "grid gap-2"}>
      {inline ? (
        <>
          {subjectLink}
          {adminLink}
        </>
      ) : (
        <>
          {adminLink}
          {subjectLink}
        </>
      )}
    </div>
  );
}
