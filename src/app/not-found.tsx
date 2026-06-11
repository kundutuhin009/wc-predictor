import Link from "next/link";
import { Trophy } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pitch text-paper shadow-card">
        <Trophy className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="font-display text-3xl font-extrabold">Off the pitch</h1>
      <p className="max-w-sm text-sm text-muted">
        That page isn&apos;t in play. Head back to the matches.
      </p>
      <Link href="/" className="btn-primary">
        Back to matches
      </Link>
    </main>
  );
}
