import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDelistConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facilityId,
      submitterName,
      submitterEmail,
      relationship,
      reason,
      // Anti-spam
      website_url,
      _timestamp,
    } = body;

    // Anti-spam: honeypot
    if (website_url) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Anti-spam: timing (< 3s)
    if (_timestamp && Date.now() - Number(_timestamp) < 3000) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Validation
    if (!facilityId?.trim()) {
      return NextResponse.json({ error: "Vyberte sportoviště." }, { status: 400 });
    }
    if (!submitterName?.trim()) {
      return NextResponse.json({ error: "Vyplňte vaše jméno." }, { status: 400 });
    }
    if (!submitterEmail?.trim()) {
      return NextResponse.json({ error: "Vyplňte váš e-mail." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      return NextResponse.json({ error: "Neplatný formát e-mailu." }, { status: 400 });
    }
    if (!relationship || !["operator", "owner", "other"].includes(relationship)) {
      return NextResponse.json({ error: "Vyberte váš vztah ke sportovišti." }, { status: 400 });
    }

    // Verify facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, name: true },
    });

    if (!facility) {
      return NextResponse.json({ error: "Sportoviště nebylo nalezeno." }, { status: 404 });
    }

    // Create edit request with delist action
    await prisma.editRequest.create({
      data: {
        facilityId: facility.id,
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        isOwner: relationship !== "other",
        changes: { _action: "delist", relationship },
        message: reason?.trim() || null,
        status: "PENDING",
      },
    });

    // Send receipt email
    await sendDelistConfirmationEmail(submitterEmail.trim(), facility.name);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create delist request:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat žádost. Zkuste to prosím později." },
      { status: 500 }
    );
  }
}
