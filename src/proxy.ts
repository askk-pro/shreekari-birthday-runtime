import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "shreekari_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout"
  ) {
    return NextResponse.next();
  }

  const sessionToken = process.env.BIRTHDAY_APP_SESSION_TOKEN;
  if (!sessionToken) {
    return new NextResponse("Application authentication is not configured.", {
      status: 503,
    });
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session === sessionToken) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  const nextPath = pathname + search;
  if (nextPath !== "/") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
