import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

// GET /api/auth/my-preferences — get notification preferences
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailNotifications: true, weeklyDigest: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/auth/my-preferences — update notification preferences
export async function PATCH(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { emailNotifications?: boolean; weeklyDigest?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, boolean> = {};
  if (typeof body.emailNotifications === "boolean") {
    data.emailNotifications = body.emailNotifications;
  }
  if (typeof body.weeklyDigest === "boolean") {
    data.weeklyDigest = body.weeklyDigest;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { emailNotifications: true, weeklyDigest: true },
  });

  return NextResponse.json(updated);
}
