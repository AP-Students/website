import {
  BlockBrowserNavigation,
  NavigationBlockerProvider,
} from "./_components/navigation-block";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationBlockerProvider>
        <BlockBrowserNavigation />
        {children}
      </NavigationBlockerProvider>
    </>
  );
}
