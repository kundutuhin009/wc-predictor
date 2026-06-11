"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Loader2, ArrowRight } from "lucide-react";

type Step = "email" | "code" | "name" | "checking";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("checking");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: forward an already-onboarded user to the app; drop a
  // verified-but-unnamed user straight to the name step; otherwise sign in.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setStep("email");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (profile) {
        router.replace("/");
        router.refresh();
      } else {
        setEmail(user.email ?? "");
        setStep("name");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error || !data.user) {
      setBusy(false);
      setError(error?.message ?? "That code didn't work. Try again.");
      return;
    }

    // First time in? If no profile row yet, ask for a display name.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    setBusy(false);
    if (profile) {
      router.replace("/");
      router.refresh();
    } else {
      setStep("name");
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("Session expired. Start over.");
      setStep("email");
      return;
    }
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      display_name: displayName.trim(),
    });
    setBusy(false);
    // 23505 = the row already exists (double-submit / two tabs racing the same
    // first login). The profile is keyed by auth uid, so it's already there —
    // treat as success and carry on instead of surfacing an error.
    if (error && error.code !== "23505") {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pitch text-white shadow-card">
            <Trophy className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            World Cup 2026
          </h1>
          <p className="mt-1 font-display text-lg font-bold text-pitch">
            Score Predictor
          </p>
          <p className="mt-3 text-sm text-muted">
            Predict the exact scoreline. One point per exact hit.
          </p>
        </div>

        <div className="rounded-xl2 border border-line bg-card p-6 shadow-card animate-slide-up">
          {step === "checking" && (
            <div className="flex items-center justify-center py-6 text-muted">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="sr-only">Loading</span>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-base outline-none focus:border-pitch focus:bg-white"
                />
              </label>
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <>
                    Send me a code <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-muted">
                No password. We email you a 6-digit code.
              </p>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <p className="text-sm text-muted">
                  We sent a 6-digit code to
                </p>
                <p className="font-medium text-ink">{email}</p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Verification code
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] tnum outline-none focus:border-pitch focus:bg-white"
                />
              </label>
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  "Verify & continue"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-center text-sm text-muted underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </form>
          )}

          {step === "name" && (
            <form onSubmit={saveName} className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">One last thing</h2>
                <p className="mt-1 text-sm text-muted">
                  Pick a name for the leaderboard. Everyone will see this.
                </p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Display name
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rohit K."
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-base outline-none focus:border-pitch focus:bg-white"
                />
              </label>
              <button
                type="submit"
                disabled={busy || displayName.trim().length === 0}
                className="btn-primary w-full"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  "Enter the pool"
                )}
              </button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Not playing?{" "}
          <Link
            href="/results"
            className="font-semibold text-pitch underline-offset-2 hover:underline"
          >
            Watch the results board
          </Link>{" "}
          — no login needed.
        </p>
      </div>
    </main>
  );
}
