import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminFromRequest } from "@/lib/admin-auth";

// PATCH — confirm or cancel a payment, activate/deactivate premium
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminFromRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, adminNote } = body as { action: "confirm" | "cancel"; adminNote?: string };

  const order = await prisma.premiumOrder.findUnique({
    where: { id },
    include: { facility: { select: { id: true, name: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
  }

  if (action === "confirm") {
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Lze potvrdit pouze čekající objednávky" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update order + activate premium in a transaction
    await prisma.$transaction([
      prisma.premiumOrder.update({
        where: { id },
        data: {
          status: "confirmed",
          confirmedAt: now,
          adminNote: adminNote || null,
        },
      }),
      prisma.facility.update({
        where: { id: order.facilityId },
        data: {
          isPremium: true,
          isPromo: false, // paid premium replaces promo
          premiumExpiresAt: expiresAt,
          subscriptionStatus: "active",
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Premium aktivováno" });
  }

  if (action === "cancel") {
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Lze zrušit pouze čekající objednávky" }, { status: 400 });
    }

    await prisma.premiumOrder.update({
      where: { id },
      data: {
        status: "cancelled",
        adminNote: adminNote || null,
      },
    });

    return NextResponse.json({ success: true, message: "Objednávka zrušena" });
  }

  return NextResponse.json({ error: "Neplatná akce" }, { status: 400 });
}
