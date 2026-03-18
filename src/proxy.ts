import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "admin_session";
const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "hraju-cz-admin-secret-change-in-production"
);

async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect admin pages
  if (pathname.startsWith("/admin")) {
    const authenticated = await isAdminAuthenticated(request);
    if (!authenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect admin API routes (except auth endpoint)
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth")) {
    const authenticated = await isAdminAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect admin-only API mutations
  const method = request.method;
  const isMutation = method === "POST" || method === "PATCH" || method === "DELETE";

  if (isMutation) {
    // /api/facilities — all mutations are admin-only
    // /api/owner-tokens — generating claim tokens is admin-only
    // /api/edit-requests PATCH/DELETE — reviewing requests is admin-only
    // /api/edit-requests POST — public (anyone can submit a suggestion)
    const needsAdmin =
      pathname.startsWith("/api/facilities") ||
      pathname.startsWith("/api/owner-tokens") ||
      (pathname.startsWith("/api/edit-requests") && method !== "POST");

    if (needsAdmin) {
      const authenticated = await isAdminAuthenticated(request);
      if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
