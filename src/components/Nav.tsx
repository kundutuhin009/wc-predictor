"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  ListOrdered,
  ClipboardList,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

type Props = {
  displayName: string;
  isAdmin: boolean;
};

export function Nav({ displayName, isAdmin }: Props) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Matches", icon: Trophy },
    { href: "/my-predictions", label: "My Picks", icon: ClipboardList },
    { href: "/leaderboard", label: "Standings", icon: ListOrdered },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          aria-label="WC26 Predictor — matches home"
          className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus-visible:opacity-80"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch text-paper">
            <Trophy className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-display text-base font-extrabold leading-none tracking-tight">
            WC26
            <span className="block text-[10px] font-bold uppercase tracking-widest text-pitch-dark">
              Predictor
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-pitch-light text-pitch-dark"
                    : "text-muted hover:bg-card hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <form action={signOut}>
            <button
              type="submit"
              title={`Sign out — ${displayName}`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
