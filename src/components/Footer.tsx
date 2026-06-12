import { cn } from "@/lib/cn";

// Shared attribution line. Subtle by design — muted text with a quiet gold
// accent on the community name. Reused as the page footer and (on /login) as a
// small credit near the header.
export function Attribution({ className }: { className?: string }) {
  return (
    <p className={cn("text-center text-xs text-muted", className)}>
      Initiative by{" "}
      <span className="font-semibold text-pitch-dark">NFF Community</span>
    </p>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("px-4 pb-8 pt-6", className)}>
      <Attribution />
    </footer>
  );
}
