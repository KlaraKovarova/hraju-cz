import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendEventSubmissionConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      dateStart,
      dateEnd,
      city,
      region,
      description,
      externalUrl,
      submitterName,
      submitterEmail,
      website_url, // honeypot
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
    if (!name?.trim()) {
      return NextResponse.json({ error: "Vyplňte název akce." }, { status: 400 });
    }
    if (!dateStart) {
      return NextResponse.json({ error: "Vyplňte datum začátku." }, { status: 400 });
    }

    const startDate = new Date(dateStart);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Neplatný formát data." }, { status: 400 });
    }

    if (startDate < new Date()) {
      return NextResponse.json({ error: "Datum akce musí být v budoucnosti." }, { status: 400 });
    }

    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    if (startDate > twoMonthsLater) {
      return NextResponse.json(
        { error: "Datum akce může být maximálně 2 měsíce dopředu." },
        { status: 400 }
      );
    }

    if (!city?.trim()) {
      return NextResponse.json({ error: "Vyplňte město konání." }, { status: 400 });
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

    // Rate limit: max 3 submissions per email per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.touristEvent.count({
      where: {
        source: "user",
        createdAt: { gte: oneDayAgo },
        // We'll store submitter email in description as metadata
      },
    });
    // Simple global rate limit - max 20 user submissions per day
    if (recentCount >= 20) {
      return NextResponse.json(
        { error: "Příliš mnoho odeslaných akcí. Zkuste to zítra." },
        { status: 429 }
      );
    }

    let endDate: Date | null = null;
    if (dateEnd) {
      endDate = new Date(dateEnd);
      if (isNaN(endDate.getTime())) endDate = null;
    }

    const sourceId = `user-${randomUUID()}`;

    await prisma.touristEvent.create({
      data: {
        sourceId,
        name: name.trim(),
        dateStart: startDate,
        dateEnd: endDate,
        city: city.trim(),
        region: region?.trim() || null,
        description: description?.trim()
          ? `${description.trim()}\n\n---\nOdesláno: ${submitterName.trim()} (${submitterEmail.trim()})`
          : `Odesláno: ${submitterName.trim()} (${submitterEmail.trim()})`,
        externalUrl: externalUrl?.trim() || null,
        source: "user",
        isActive: false, // pending admin approval
      },
    });

    // Send confirmation email
    await sendEventSubmissionConfirmationEmail(
      submitterEmail.trim(),
      name.trim()
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create event submission:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat akci. Zkuste to prosím později." },
      { status: 500 }
    );
  }
}
