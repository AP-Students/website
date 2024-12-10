import {
  BlockBrowserNavigation,
  NavigationBlockerProvider,
} from "./navigation-block";

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
