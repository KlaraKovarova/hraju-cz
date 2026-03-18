import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner-auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// POST — Create Stripe Customer Portal session
export async function POST() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const facility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      select: { stripeCustomerId: true },
    });

    if (!facility?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hraju.cz";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: facility.stripeCustomerId,
      return_url: `${baseUrl}/moje-sportoviste`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Failed to create portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
