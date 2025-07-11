// middleware.ts (in your root directory, same level as app/ folder)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname.startsWith("/__nextjs")
  ) {
    return NextResponse.next();
  }

  // Admin routes that require admin privileges
  const adminRoutes = [
    "/admin/register-user",
    "/admin/users",
    "/admin/settings",
    "/admin/reports",
  ];

  // Protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/leads",
    "/tasks",
    "/reports",
    "/profile",
    ...adminRoutes,
  ];

  // Public routes (allow without authentication)
  const publicRoutes = ["/login", "/", "/forgot-password"];

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  // const isPublicRoute = publicRoutes.includes(pathname);

  // Get auth data from cookies (adjust based on how you store auth data)
  const accessToken = request.cookies.get("access_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing admin route without admin role, redirect to dashboard
  if (isAdminRoute && accessToken && userRole !== "admin") {
    const dashboardUrl = new URL("/dashboard", request.url);
    dashboardUrl.searchParams.set("error", "admin-access-required");
    return NextResponse.redirect(dashboardUrl);
  }

  // If authenticated user tries to access public auth routes, redirect to dashboard
  if (accessToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
