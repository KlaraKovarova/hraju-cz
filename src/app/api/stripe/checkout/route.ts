import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getOwnerSession } from "@/lib/owner-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { facilityId } = body;

    if (!facilityId || facilityId !== session.facilityId) {
      return NextResponse.json({ error: "Invalid facility" }, { status: 400 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, name: true, stripeCustomerId: true, isPremium: true },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    if (facility.isPremium) {
      return NextResponse.json({ error: "Facility is already premium" }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRICE_MONTHLY;
    if (!priceId) {
      console.error("STRIPE_PRICE_MONTHLY is not configured");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { facilityId },
      customer: facility.stripeCustomerId || undefined,
      success_url: `${baseUrl}/moje-sportoviste?upgraded=true`,
      cancel_url: `${baseUrl}/moje-sportoviste`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
