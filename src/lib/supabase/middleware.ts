import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() instead of getSession() for server-side auth verification.
  // getSession() only reads from storage and doesn't validate with Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes - redirect unauthenticated users to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/callback") &&
    !request.nextUrl.pathname.startsWith("/invite") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.startsWith("/approve") &&
    !request.nextUrl.pathname.startsWith("/reject") &&
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/sitemap.xml" &&
    request.nextUrl.pathname !== "/robots.txt"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    // For OAuth authorize requests, preserve the full URL so the user
    // returns to the consent page after login.
    if (request.nextUrl.pathname.startsWith("/oauth/authorize")) {
      url.searchParams.set("redirect_to", request.nextUrl.pathname + request.nextUrl.search);
    }

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
