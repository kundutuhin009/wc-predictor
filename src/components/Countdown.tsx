"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { closeTimeMs } from "@/lib/time";

// Live countdown to the moment predictions close (kickoff − 15 min).
// Display only — the server is the source of truth for the actual lock.
export function Countdown({
  kickoffIso,
  onClose,
}: {
  kickoffIso: string;
  onClose?: () => void;
}) {
  const target = closeTimeMs(kickoffIso);
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const tick = () => {
      const r = target - Date.now();
      setRemaining(r);
      if (r <= 0) onClose?.();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, onClose]);

  if (remaining <= 0) {
    return <span className="font-medium text-muted">Predictions closed</span>;
  }

  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const label =
    d > 0
      ? `${d}d ${h}h ${m}m`
      : h > 0
        ? `${h}h ${m}m ${String(s).padStart(2, "0")}s`
        : `${m}m ${String(s).padStart(2, "0")}s`;

  const urgent = remaining < 60 * 60 * 1000; // under an hour

  return (
    <span
      className={cnUrgent(urgent)}
      aria-label={`Predictions close in ${label}`}
    >
      <Timer className="h-3.5 w-3.5" aria-hidden />
      <span className="tnum font-semibold">{label}</span>
      <span className="opacity-70">left</span>
    </span>
  );
}

function cnUrgent(urgent: boolean) {
  return [
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
    urgent ? "bg-amber-light text-amber" : "bg-pitch-light text-pitch-dark",
  ].join(" ");
}
