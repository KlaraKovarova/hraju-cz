import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SPORT_SUBDOMAINS } from "@/lib/sports";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "hraju.cz";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // Strip port for local dev
  const host = hostname.split(":")[0];

  // Check if we're on a sport subdomain
  const subdomain = host.endsWith(`.${ROOT_DOMAIN}`)
    ? host.slice(0, -(ROOT_DOMAIN.length + 1))
    : host.endsWith(".localhost")
      ? host.slice(0, -".localhost".length)
      : null;

  if (subdomain && SPORT_SUBDOMAINS.includes(subdomain as (typeof SPORT_SUBDOMAINS)[number])) {
    // Rewrite to /sport/[subdomain]/...
    const path = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/sport/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
