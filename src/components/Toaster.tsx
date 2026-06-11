"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ToastDetail } from "@/lib/toast";
import { cn } from "@/lib/cn";

type Item = ToastDetail & { id: number };

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let counter = 0;
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      const id = ++counter;
      setItems((prev) => [...prev, { ...detail, id }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 3200);
    }
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-card animate-pop-in",
            item.kind === "success"
              ? "border-pitch/40 bg-card text-ink"
              : "border-red-500/40 bg-card text-ink",
          )}
          role="status"
        >
          {item.kind === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-pitch" aria-hidden />
          ) : (
            <XCircle className="h-5 w-5 text-miss" aria-hidden />
          )}
          {item.message}
        </div>
      ))}
    </div>
  );
}
