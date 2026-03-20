import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { verifyAdminFromRequest } from "@/lib/admin-auth";
import { sendClaimOutreachEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminFromRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { facilityId } = await request.json();

    if (!facilityId) {
      return NextResponse.json(
        { error: "facilityId is required" },
        { status: 400 }
      );
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        location: true,
        sports: { include: { sport: { select: { slug: true, nameCs: true } } } },
        contacts: { where: { type: "EMAIL" } },
      },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      );
    }

    const emailContact = facility.contacts.find((c) => c.type === "EMAIL");
    if (!emailContact) {
      return NextResponse.json(
        { error: "Facility has no email contact" },
        { status: 400 }
      );
    }

    // Generate owner token (30-day expiry)
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.ownerToken.create({
      data: {
        facilityId,
        token,
        ownerEmail: emailContact.value,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";
    const sportSlug = facility.sports[0]?.sport.slug || "sport";
    const sportName = facility.sports[0]?.sport.nameCs || "Sport";
    const facilityUrl = `${baseUrl}/sport/${sportSlug}/${facility.slug}`;
    const claimUrl = `${baseUrl}/moje-sportoviste?token=${token}`;

    const sent = await sendClaimOutreachEmail(emailContact.value, {
      facilityName: facility.name,
      facilityUrl,
      facilitySlug: facility.slug,
      claimUrl,
      sportName,
      city: facility.location.city,
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email (SMTP not configured or error)" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sentTo: emailContact.value,
      facilityName: facility.name,
    });
  } catch (error) {
    console.error("Failed to send outreach email:", error);
    return NextResponse.json(
      { error: "Failed to send outreach email" },
      { status: 500 }
    );
  }
}
