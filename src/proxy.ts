import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createIntlMiddleware(routing);

const ADMIN_COOKIE = "admin_session";

let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_JWT_SECRET environment variable is required. Set a strong random value in your environment."
    );
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** Strip locale prefix from pathname for pattern matching */
function stripLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || "/";
    }
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes — admin auth only, no locale routing
  if (pathname.startsWith("/api/")) {
    // Skip login endpoint
    if (pathname.startsWith("/api/admin/auth")) {
      return NextResponse.next();
    }

    // Protect admin API routes
    if (pathname.startsWith("/api/admin")) {
      const authenticated = await isAdminAuthenticated(request);
      if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Protect admin-only API mutations
    const method = request.method;
    const isMutation = method === "POST" || method === "PATCH" || method === "DELETE";

    if (isMutation) {
      const communitySubpaths = ["/reviews", "/visit", "/favorite", "/tips", "/replies", "/helpful", "/flag"];
      const isCommunityEndpoint = communitySubpaths.some(sub => pathname.includes(sub));
      const needsAdmin =
        (pathname.startsWith("/api/facilities") && !isCommunityEndpoint) ||
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

  // Page routes — check admin auth, then delegate to intl middleware
  const normalizedPath = stripLocalePrefix(pathname);

  // Admin pages (except login) — require auth
  if (normalizedPath.startsWith("/admin") && normalizedPath !== "/admin/login") {
    const authenticated = await isAdminAuthenticated(request);
    if (!authenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Delegate to next-intl middleware for locale detection and routing
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Exclude static/image assets and data routes (sitemap.xml, sitemap-images.xml,
    // robots.txt, llms.txt, llms-full.txt) so next-intl never rewrites them into the
    // [locale] tree — SIL-663.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:xml|txt|svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
