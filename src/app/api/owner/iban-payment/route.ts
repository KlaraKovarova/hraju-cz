import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/owner-auth";
import {
  generateVariableSymbol,
  generateSpdQrDataUrl,
  buildSpdString,
  PAYMENT_IBAN,
  PAYMENT_AMOUNT,
} from "@/lib/spd-qr";

// GET — get current pending/confirmed payment for the owner's facility
export async function GET() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.premiumOrder.findFirst({
    where: {
      facilityId: session.facilityId,
      status: { in: ["pending", "confirmed"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!order) {
    return NextResponse.json({ order: null });
  }

  const qrDataUrl = order.status === "pending"
    ? await generateSpdQrDataUrl(order.variableSymbol)
    : null;

  return NextResponse.json({
    order: {
      id: order.id,
      variableSymbol: order.variableSymbol,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
    },
    qrDataUrl,
    spdString: order.status === "pending" ? buildSpdString(order.variableSymbol) : null,
    iban: PAYMENT_IBAN,
  });
}

// POST — create a new IBAN payment order
export async function POST() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check facility exists and isn't already premium
  const facility = await prisma.facility.findUnique({
    where: { id: session.facilityId },
    select: { id: true, isPremium: true, name: true },
  });

  if (!facility) {
    return NextResponse.json({ error: "Sportoviště nenalezeno" }, { status: 404 });
  }

  if (facility.isPremium) {
    return NextResponse.json({ error: "Sportoviště již má Premium" }, { status: 400 });
  }

  // Check for existing pending order
  const existing = await prisma.premiumOrder.findFirst({
    where: {
      facilityId: session.facilityId,
      status: "pending",
    },
  });

  if (existing) {
    const qrDataUrl = await generateSpdQrDataUrl(existing.variableSymbol);
    return NextResponse.json({
      order: {
        id: existing.id,
        variableSymbol: existing.variableSymbol,
        amount: existing.amount,
        status: existing.status,
        createdAt: existing.createdAt,
      },
      qrDataUrl,
      spdString: buildSpdString(existing.variableSymbol),
      iban: PAYMENT_IBAN,
    });
  }

  // Create new order
  const variableSymbol = generateVariableSymbol();
  const order = await prisma.premiumOrder.create({
    data: {
      facilityId: session.facilityId,
      variableSymbol,
      amount: PAYMENT_AMOUNT,
    },
  });

  const qrDataUrl = await generateSpdQrDataUrl(order.variableSymbol);

  return NextResponse.json({
    order: {
      id: order.id,
      variableSymbol: order.variableSymbol,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
    },
    qrDataUrl,
    spdString: buildSpdString(order.variableSymbol),
    iban: PAYMENT_IBAN,
  });
}
