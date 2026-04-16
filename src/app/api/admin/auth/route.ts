import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  createAdminSession,
  setAdminCookie,
  getAdminSession,
  clearAdminSession,
} from "@/lib/admin-auth";

/**
 * Constant-time password comparison to prevent timing attacks.
 * Returns false for any non-string input or length mismatch without leaking
 * information via early return timing.
 */
function safePasswordEqual(provided: unknown, expected: string): boolean {
  if (typeof provided !== "string") return false;
  const providedBuf = Buffer.from(provided, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  // timingSafeEqual requires equal-length buffers; pad provided to expected length
  // and compare length separately to keep the comparison constant-time against
  // the expected password.
  const padded = Buffer.alloc(expectedBuf.length);
  providedBuf.copy(padded, 0, 0, Math.min(providedBuf.length, expectedBuf.length));
  const eq = timingSafeEqual(padded, expectedBuf);
  return eq && providedBuf.length === expectedBuf.length;
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD env var not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!safePasswordEqual(password, adminPassword)) {
      return NextResponse.json(
        { error: "Nesprávné heslo" },
        { status: 401 }
      );
    }

    const jwt = await createAdminSession();
    await setAdminCookie(jwt);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isAdmin = await getAdminSession();
  return NextResponse.json({ authenticated: isAdmin });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
