import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

// Magic-link return URL. Completes sign-in, then routes by onboarding state:
//   no profile yet  -> /login (the name step picks up the live session)
//   admin           -> /admin
//   member          -> /
//
// IMPORTANT (session persistence): cookies set via next/headers `cookies()` do
// NOT get flushed onto a manually-returned NextResponse.redirect in this runtime
// (verified empirically), so the shared server client (server.ts) would silently
// drop the new session cookies here. Instead we bind setAll to a local jar and
// write those cookies directly onto the redirect response we return — the same
// approach the middleware uses. This is what makes the session actually persist.
//
// Must be reachable logged-out (middleware excludes /auth/*), since the session
// only exists AFTER the exchange below runs.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // The PKCE flow (default for @supabase/ssr) returns `?code=...`.
  const code = searchParams.get("code");
  // The default hosted magic-link template may instead return token_hash+type.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Capture every cookie Supabase wants to set, plus any required response
  // headers (no-store etc.), so we can attach them to the FINAL redirect.
  const cookieJar: { name: string; value: string; options: CookieOptions }[] =
    [];
  const headerJar: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach((c) => cookieJar.push(c));
          if (headers) Object.assign(headerJar, headers);
        },
      },
    },
  );

  // Land here on success; overwritten to /login on auth failure.
  let dest = "/";
  let authOk = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authOk = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    authOk = !error;
  }

  if (authOk) {
    // Session is set (cookies captured in cookieJar). Route by profile state.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        dest = "/login"; // first time in — the login page runs the name step
      } else if (profile.is_admin) {
        dest = "/admin";
      }
    }
  } else {
    dest = "/login?error=auth";
  }

  const response = NextResponse.redirect(`${origin}${dest}`);
  // Attach the captured auth cookies + headers onto the redirect we return —
  // this is the step that actually persists the session to the browser.
  cookieJar.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  Object.entries(headerJar).forEach(([k, v]) => response.headers.set(k, v));

  return response;
}
