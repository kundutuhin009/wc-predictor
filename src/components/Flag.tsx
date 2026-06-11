import { flagCode } from "@/lib/flags";
import { cn } from "@/lib/cn";

// Small country flag for a team. Falls back to a neutral football chip for
// TBD/placeholder teams with no clean ISO mapping (never a broken image).
export function Flag({
  team,
  className,
}: {
  team: string;
  className?: string;
}) {
  const code = flagCode(team);
  if (!code) {
    return (
      <span
        aria-hidden
        className={cn(
          "fib inline-flex items-center justify-center bg-pitch-light text-[0.6rem] leading-none",
          className,
        )}
      >
        ⚽
      </span>
    );
  }
  return (
    <span aria-hidden className={cn(`fi fi-${code} fib`, className)} />
  );
}

// Flag + team name, inline. Truncates the name; keeps the flag fixed-size.
export function TeamName({
  team,
  className,
}: {
  team: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Flag team={team} />
      <span className="truncate">{team}</span>
    </span>
  );
}
