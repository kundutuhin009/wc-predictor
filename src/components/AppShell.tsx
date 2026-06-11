import { Nav } from "./Nav";
import { Toaster } from "./Toaster";

// Page chrome for every authenticated route: sticky nav + centered column + toaster.
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
    <div className="min-h-dvh">
      <Nav displayName={displayName} isAdmin={isAdmin} />
      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">{children}</main>
      <Toaster />
    </div>
  );
}
