import {
  BlockBrowserNavigation,
  NavigationBlockerProvider,
} from "../../../components/subject/navigation-block";

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
