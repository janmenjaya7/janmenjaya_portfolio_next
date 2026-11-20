import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./app/lib/auth";

/* Gate for /admin: anyone without a valid session is sent to /admin/login.
   Pages and API routes verify the session again themselves. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isLoginPage = pathname === "/admin/login";

  if (!loggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (loggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
