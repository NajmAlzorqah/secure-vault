import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = ["/login"];
const apiPrefix = "/api";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to handle their own auth
  if (pathname.startsWith(apiPrefix)) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Try to read the session
  const token = request.cookies.get("session")?.value;
  let session: { userId: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey(), {
        algorithms: ["HS256"],
      });
      session = {
        userId: payload.userId as string,
        role: payload.role as string,
      };
    } catch {
      session = null;
    }
  }

  // Unauthenticated user trying to access protected route
  if (!isPublicRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login page
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and favicon
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
