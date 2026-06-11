"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Loader2, ArrowRight, MailCheck } from "lucide-react";

type Step = "checking" | "email" | "sent" | "name";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("checking");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: forward an already-onboarded user to the app; drop a
  // signed-in-but-unnamed user (just back from the magic link) to the name
  // step; otherwise start at the email step. Surface a callback error if any.
  useEffect(() => {
    let active = true;
    (async () => {
      if (new URLSearchParams(window.location.search).has("error")) {
        setError("That sign-in link didn't work. Request a fresh one.");
      }
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

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("sent");
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
      setError("Session expired. Request a new sign-in link.");
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
        <div className="overflow-hidden rounded-3xl border border-line shadow-card animate-slide-up">
          {/* Bold themed hero: deep pitch ink + floodlight + bright accents */}
          <div className="relative overflow-hidden bg-ink px-6 pb-8 pt-9 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-20 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(41,224,140,0.5),transparent_70%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.6)_0_1px,transparent_1px_42px)]"
            />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch text-ink shadow-glow">
                <Trophy className="h-8 w-8" aria-hidden />
              </div>
              <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-white">
                World Cup <span className="text-pitch">2026</span>
              </h1>
              <p className="mt-2 font-display text-xs font-semibold uppercase tracking-[0.35em] text-amber">
                Score Predictor
              </p>
            </div>
          </div>

          {/* Form body */}
          <div className="bg-card px-6 pb-6 pt-5">
            <p className="mb-5 text-center text-sm text-muted">
              Predict the exact scoreline. One point per exact hit.
            </p>
          {step === "checking" && (
            <div className="flex items-center justify-center py-6 text-muted">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="sr-only">Loading</span>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={sendLink} className="space-y-4">
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
                    Email me a sign-in link{" "}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-muted">
                No password. We email you a link — click it to sign in.
              </p>
            </form>
          )}

          {step === "sent" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pitch-light text-pitch-dark">
                <MailCheck className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">
                  Check your email
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Click the sign-in link we sent to
                </p>
                <p className="font-medium text-ink">{email}</p>
              </div>
              <p className="text-xs text-muted">
                The link opens this app and signs you in. You can close this tab.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="w-full text-center text-sm text-muted underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </div>
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
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Not playing?{" "}
          <Link
            href="/results"
            className="font-semibold text-pitch-dark underline-offset-2 hover:underline"
          >
            Watch the results board
          </Link>{" "}
          — no login needed.
        </p>
      </div>
    </main>
  );
}
