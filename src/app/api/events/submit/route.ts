import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendEventSubmissionConfirmationEmail } from "@/lib/email";
import { getUserSession } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Musíte být přihlášen/a." }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      dateStart,
      dateEnd,
      city,
      region,
      description,
      externalUrl,
    } = body;

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

    // Rate limit: max 5 submissions per user per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.touristEvent.count({
      where: {
        userId: session.userId,
        createdAt: { gte: oneDayAgo },
      },
    });
    if (recentCount >= 5) {
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
        description: description?.trim() || null,
        externalUrl: externalUrl?.trim() || null,
        source: "user",
        isActive: false,
        userId: session.userId,
      },
    });

    // Send confirmation email
    await sendEventSubmissionConfirmationEmail(
      session.email,
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
