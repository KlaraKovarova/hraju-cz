import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "hraju.cz";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // Strip port for local dev
  const host = hostname.split(":")[0];

  // Detect sport subdomain (e.g. tenis.hraju.cz or tenis.localhost)
  const subdomain = host.endsWith(`.${ROOT_DOMAIN}`)
    ? host.slice(0, -(ROOT_DOMAIN.length + 1))
    : host.endsWith(".localhost")
      ? host.slice(0, -".localhost".length)
      : null;

  if (subdomain) {
    // Rewrite to /sport/[subdomain]/... — the page handles unknown sports via notFound()
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
