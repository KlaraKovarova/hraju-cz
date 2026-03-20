import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "@/lib/email";

// Owner requests a magic-link by providing their email
// Finds all facilities with a matching Contact EMAIL record and sends links
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Always return the same message to prevent email enumeration
    const genericResponse = NextResponse.json({
      message: "Pokud e-mail odpovídá našim záznamům, odeslali jsme vám přihlašovací odkaz.",
    });

    const normalizedEmail = email.trim().toLowerCase();

    // Find all facilities that have this email as a Contact
    const contacts = await prisma.contact.findMany({
      where: {
        type: "EMAIL",
        value: normalizedEmail,
      },
      include: {
        facility: { select: { id: true, name: true } },
      },
    });

    if (contacts.length === 0) {
      return genericResponse;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";

    for (const contact of contacts) {
      // Rate limit: max 1 token per hour per facility+email
      const recentToken = await prisma.ownerToken.findFirst({
        where: {
          facilityId: contact.facilityId,
          ownerEmail: normalizedEmail,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

      if (recentToken) continue;

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.ownerToken.create({
        data: {
          facilityId: contact.facilityId,
          token,
          ownerEmail: normalizedEmail,
          expiresAt,
        },
      });

      const magicLinkUrl = `${baseUrl}/moje-sportoviste?token=${token}`;
      await sendMagicLinkEmail(normalizedEmail, contact.facility.name, magicLinkUrl);
    }

    return genericResponse;
  } catch (error) {
    console.error("Failed to process magic-link request:", error);
    return NextResponse.json({
      message: "Pokud e-mail odpovídá našim záznamům, odeslali jsme vám přihlašovací odkaz.",
    });
  }
}
