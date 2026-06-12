"use client";

import { useEffect } from "react";

// After the result-save full reload, restore the admin's scroll position so the
// page doesn't jump to the top. Reads the value stashed before reload (one-shot).
export function ScrollRestore() {
  useEffect(() => {
    let y: string | null = null;
    try {
      y = sessionStorage.getItem("admin-scroll");
      if (y !== null) sessionStorage.removeItem("admin-scroll");
    } catch {
      return;
    }
    if (y !== null) {
      const top = Number(y) || 0;
      // Wait for layout so the target offset exists, then jump (no smooth scroll).
      requestAnimationFrame(() => window.scrollTo(0, top));
    }
  }, []);
  return null;
}
