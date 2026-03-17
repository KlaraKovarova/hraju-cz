import { NextRequest, NextResponse } from "next/server";

// Sport subdomains for hraju.cz
const SPORT_SUBDOMAINS = [
  "tenis",
  "squash",
  "badminton",
  "volejbal",
  "plavani",
  "golf",
  "fitness",
  "bowling",
];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Extract subdomain
  // In production: tenis.hraju.cz -> subdomain = "tenis"
  // In local dev with custom hosts: tenis.localhost:3000 -> subdomain = "tenis"
  const hostParts = hostname.split(".");

  let subdomain: string | null = null;

  // Production: tenis.hraju.cz
  if (hostname.endsWith(".hraju.cz") && hostParts.length >= 3) {
    subdomain = hostParts[0];
  }
  // Local dev: tenis.localhost or tenis.localhost:3000
  else if (hostname.includes(".localhost")) {
    subdomain = hostParts[0];
  }

  if (subdomain && SPORT_SUBDOMAINS.includes(subdomain)) {
    // Rewrite to /sport/[slug] route internally
    url.pathname = `/sport/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
