import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facilityId,
      submitterName,
      submitterEmail,
      submitterPhone,
      isOwner,
      changes,
      message,
    } = body;

    if (!facilityId || !submitterName || !submitterEmail || !changes) {
      return NextResponse.json(
        { error: "Vyplňte prosím všechna povinná pole." },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      return NextResponse.json(
        { error: "Neplatný formát e-mailu." },
        { status: 400 }
      );
    }

    // Verify facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, name: true },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Sportoviště nebylo nalezeno." },
        { status: 404 }
      );
    }

    const editRequest = await prisma.editRequest.create({
      data: {
        facilityId,
        submitterName,
        submitterEmail,
        submitterPhone: submitterPhone || null,
        isOwner: isOwner ?? false,
        changes,
        message: message || null,
      },
    });

    // Magic-link flow: if owner claims facility, check email against Contact records
    let magicLinkSent = false;
    if (isOwner) {
      const emailContact = await prisma.contact.findFirst({
        where: {
          facilityId,
          type: "EMAIL",
          value: submitterEmail.trim().toLowerCase(),
        },
      });

      if (emailContact) {
        // Email matches a known contact — generate token and send magic link
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await prisma.ownerToken.create({
          data: {
            facilityId,
            token,
            ownerEmail: submitterEmail.trim(),
            ownerName: submitterName.trim(),
            expiresAt,
          },
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hraju.cz";
        const magicLinkUrl = `${baseUrl}/moje-sportoviste?token=${token}`;

        magicLinkSent = await sendMagicLinkEmail(
          submitterEmail.trim(),
          facility.name,
          magicLinkUrl
        );
      }
    }

    return NextResponse.json(
      { ...editRequest, magicLinkSent },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create edit request:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat návrh úpravy. Zkuste to prosím později." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const editRequests = await prisma.editRequest.findMany({
      where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {},
      include: {
        facility: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(editRequests);
  } catch {
    return NextResponse.json(
      { error: "Databáze je nedostupná." },
      { status: 503 }
    );
  }
}
