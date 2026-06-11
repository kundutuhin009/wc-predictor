"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { MatchForm } from "./MatchForm";
import { cn } from "@/lib/cn";

export function AddMatchPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl2 border border-line bg-card p-4 shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="inline-flex items-center gap-2 font-display font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pitch text-white">
            <Plus className="h-4 w-4" aria-hidden />
          </span>
          Add a match
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-4 animate-slide-up">
          <MatchForm mode="add" onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
