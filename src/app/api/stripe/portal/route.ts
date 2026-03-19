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
      select: { stripeCustomerId: true },
    });

    if (!facility?.stripeCustomerId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: facility.stripeCustomerId,
      return_url: `${baseUrl}/moje-sportoviste`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal failed:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
