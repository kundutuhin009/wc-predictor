import { Star, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Tiered scoring badge for a graded prediction, read from predictions.points:
//   3 = exact score   → gold highlight
//   1 = correct result → muted green
//   0 = wrong          → muted red
// Renders nothing until graded (points == null).
export function PointsBadge({
  points,
  className,
}: {
  points: number | null;
  className?: string;
}) {
  if (points == null) return null;

  const label = `${points} ${points === 1 ? "pt" : "pts"}`;
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold";

  if (points >= 3) {
    return (
      <span className={cn(base, "bg-pitch-light text-pitch-dark", className)}>
        <Star className="h-3.5 w-3.5" aria-hidden /> {label}
      </span>
    );
  }
  if (points >= 1) {
    return (
      <span className={cn(base, "bg-paper font-semibold text-win", className)}>
        <Check className="h-3.5 w-3.5" aria-hidden /> {label}
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-paper font-medium text-miss", className)}>
      <X className="h-3.5 w-3.5" aria-hidden /> {label}
    </span>
  );
}
