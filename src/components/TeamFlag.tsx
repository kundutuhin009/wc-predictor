import { Volleyball } from "lucide-react";
import { flagCode } from "@/lib/teamFlags";
import { cn } from "@/lib/cn";

// Small country flag next to a team name. Renders a flag-icons span when the
// team maps to an ISO code, otherwise a neutral lucide football icon (for TBD /
// placeholder knockout rows or anything unmapped) — never a broken/empty flag.
// All fallback logic lives here so every call site stays simple.
export function TeamFlag({
  team,
  className,
}: {
  team: string;
  className?: string;
}) {
  const code = flagCode(team);
  if (!code) {
    return (
      <Volleyball
        aria-hidden
        className={cn("h-[0.95rem] w-[0.95rem] shrink-0 text-muted", className)}
      />
    );
  }
  return <span aria-hidden className={cn(`fi fi-${code} fib`, className)} />;
}
