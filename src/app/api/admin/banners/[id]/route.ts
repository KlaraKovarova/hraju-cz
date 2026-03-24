import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// PATCH /api/admin/banners/[id] — update a banner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.targetUrl !== undefined) data.targetUrl = body.targetUrl;
    if (body.placement !== undefined) data.placement = body.placement;
    if (body.sportFilter !== undefined) data.sportFilter = body.sportFilter;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

    const banner = await prisma.banner.update({
      where: { id },
      data,
    });

    return NextResponse.json(banner);
  } catch {
    return NextResponse.json({ error: "Banner nenalezen." }, { status: 404 });
  }
}

// DELETE /api/admin/banners/[id] — delete a banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Banner nenalezen." }, { status: 404 });
  }
}
