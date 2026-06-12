export function getTestParentPath(pathname: string | null | undefined) {
  if (!pathname) return "/";

  const parts = pathname.split("/").filter(Boolean);

  if (parts.length <= 1) return "/";

  return `/${parts.slice(0, 2).join("/")}`;
}
