"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetch the server component tree when the tab regains focus, so the public
// results board picks up newly-confirmed scores without a manual reload.
// Pairs with `export const revalidate` on the page (the time-based fallback).
export function FocusRefresh() {
  const router = useRouter();
  useEffect(() => {
    const onFocus = () => router.refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);
  return null;
}
