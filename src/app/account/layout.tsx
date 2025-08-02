import Navbar from "@/components/global/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar className="sm:bg-primary-foreground" />
      {children}
    </>
  );
}
