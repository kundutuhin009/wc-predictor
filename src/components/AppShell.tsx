import { Nav } from "./Nav";
import { Toaster } from "./Toaster";
import { Footer } from "./Footer";

// Page chrome for every authenticated route: sticky nav + centered column +
// subtle footer credit + toaster.
export function AppShell({
  displayName,
  isAdmin,
  children,
}: {
  displayName: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav displayName={displayName} isAdmin={isAdmin} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
