import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session on every request and gates unauthenticated
// users to /login. Returns the response (with refreshed auth cookies) to emit.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  // Public, no-login routes. /results is the anonymous announcement board.
  const isPublic = isLogin || path === "/results" || path.startsWith("/results/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // NB: we deliberately do NOT bounce a signed-in user off /login here. A user
  // mid-signup (OTP verified, profile row not yet created) lives on /login at
  // the "name" step; redirecting them to / would trip requireProfile, which
  // sends them back to /login — an infinite loop. The /login page itself
  // forwards already-onboarded users to / on mount.

  return response;
}
