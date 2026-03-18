import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  setAdminCookie,
  getAdminSession,
  clearAdminSession,
} from "@/lib/admin-auth";

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

    if (password !== adminPassword) {
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
