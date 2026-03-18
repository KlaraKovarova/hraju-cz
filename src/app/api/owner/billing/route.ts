import { NextRequest, NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner-auth";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// POST — Create Stripe Checkout session
export async function POST(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan } = await request.json();
    const priceId = plan === "yearly" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 }
      );
    }

    const facility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
        isPremium: true,
        subscriptionStatus: true,
      },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    if (facility.isPremium && facility.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "Facility already has an active premium subscription" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hraju.cz";

    // Reuse existing Stripe customer or let Checkout create one
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/moje-sportoviste?billing=success`,
      cancel_url: `${baseUrl}/moje-sportoviste?billing=cancelled`,
      metadata: {
        facilityId: facility.id,
      },
      ...(facility.stripeCustomerId && {
        customer: facility.stripeCustomerId,
      }),
      subscription_data: {
        metadata: {
          facilityId: facility.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// GET — Get current subscription status
export async function GET() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const facility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      select: {
        isPremium: true,
        subscriptionStatus: true,
        premiumExpiresAt: true,
        stripeSubscriptionId: true,
      },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    return NextResponse.json({
      isPremium: facility.isPremium,
      subscriptionStatus: facility.subscriptionStatus,
      premiumExpiresAt: facility.premiumExpiresAt,
      hasSubscription: !!facility.stripeSubscriptionId,
    });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
