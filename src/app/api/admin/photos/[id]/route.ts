import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// PATCH /api/admin/photos/[id] — hide/unhide/delete a photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;

  if (action === "hide") {
    await prisma.userPhoto.update({
      where: { id },
      data: { isHidden: true },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "unhide") {
    await prisma.userPhoto.update({
      where: { id },
      data: { isHidden: false },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await prisma.userPhoto.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
