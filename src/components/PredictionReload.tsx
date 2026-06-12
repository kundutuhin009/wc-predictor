"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

// Runs on mount after a "lock in prediction" full reload: restores the user's
// scroll position and shows the success flash toast that was stashed before the
// reload (the pre-reload toast is lost). Both values are one-shot.
export function PredictionReload() {
  useEffect(() => {
    let scroll: string | null = null;
    let flash: string | null = null;
    try {
      scroll = sessionStorage.getItem("pred-scroll");
      flash = sessionStorage.getItem("pred-flash");
      if (scroll !== null) sessionStorage.removeItem("pred-scroll");
      if (flash !== null) sessionStorage.removeItem("pred-flash");
    } catch {
      return;
    }
    if (scroll !== null) {
      const top = Number(scroll) || 0;
      requestAnimationFrame(() => window.scrollTo(0, top));
    }
    if (flash) {
      toast(flash, "success");
    }
  }, []);
  return null;
}
