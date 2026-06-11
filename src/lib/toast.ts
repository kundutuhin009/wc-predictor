export type ToastKind = "success" | "error";

export type ToastDetail = { message: string; kind: ToastKind };

// Fire-and-forget toast. The <Toaster /> mounted in the layout listens for these.
export function toast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>("app:toast", { detail: { message, kind } }),
  );
}
