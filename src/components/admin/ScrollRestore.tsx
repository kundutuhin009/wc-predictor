"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

// Runs on mount after the result-save full reload:
//  - restores the admin's scroll position (so the page doesn't jump to top)
//  - shows the success flash toast stashed before the reload (so the admin gets
//    confirmation the save committed, since the pre-reload toast is lost).
// Both values are one-shot (cleared after reading).
export function ScrollRestore() {
  useEffect(() => {
    let scroll: string | null = null;
    let flash: string | null = null;
    try {
      scroll = sessionStorage.getItem("admin-scroll");
      flash = sessionStorage.getItem("admin-flash");
      if (scroll !== null) sessionStorage.removeItem("admin-scroll");
      if (flash !== null) sessionStorage.removeItem("admin-flash");
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
