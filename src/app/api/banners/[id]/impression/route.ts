import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/banners/[id]/impression — increment impression count
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.banner.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Banner not found" }, { status: 404 });
  }
}
