import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (await prisma.facility.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }
  return slug;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      sportSlugs,
      description,
      courtsLanes,
      address,
      city,
      postalCode,
      region,
      phone,
      email,
      website,
      openingHours,
      pricing,
      submitterName,
      submitterEmail,
      submitterPhone,
      // Anti-spam fields
      website_url, // honeypot
      _timestamp,
    } = body;

    // Anti-spam: honeypot check (silent 201 to not reveal detection)
    if (website_url) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Anti-spam: timing check (< 3 seconds = bot)
    if (_timestamp && Date.now() - Number(_timestamp) < 3000) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Check user session — logged-in users get priority and auto-filled info
    const session = await getUserSession();
    const effectiveName = session?.name || submitterName;
    const effectiveEmail = session?.email || submitterEmail;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Vyplňte název sportoviště." }, { status: 400 });
    }
    if (!Array.isArray(sportSlugs) || sportSlugs.length === 0) {
      return NextResponse.json({ error: "Vyberte alespoň jeden sport." }, { status: 400 });
    }
    if (!address?.trim()) {
      return NextResponse.json({ error: "Vyplňte adresu." }, { status: 400 });
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: "Vyplňte město." }, { status: 400 });
    }
    if (!effectiveName?.trim()) {
      return NextResponse.json({ error: "Vyplňte vaše jméno." }, { status: 400 });
    }
    if (!effectiveEmail?.trim()) {
      return NextResponse.json({ error: "Vyplňte váš e-mail." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      return NextResponse.json({ error: "Neplatný formát e-mailu." }, { status: 400 });
    }
    if (postalCode && !/^\d{5}$/.test(postalCode.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "PSČ musí mít 5 číslic." }, { status: 400 });
    }

    // Validate sport slugs
    const validSports = await prisma.sport.findMany({
      where: { slug: { in: sportSlugs } },
      select: { id: true, slug: true },
    });
    if (validSports.length === 0) {
      return NextResponse.json({ error: "Žádný z vybraných sportů nebyl nalezen." }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = slugify(name.trim());
    const slug = await uniqueSlug(baseSlug);

    // Find or create location (can't use upsert — compound unique rejects null region)
    const trimmedCity = city.trim();
    const trimmedRegion = region?.trim() || null;

    let location = await prisma.location.findFirst({
      where: { city: trimmedCity, region: trimmedRegion },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city: trimmedCity, region: trimmedRegion },
      });
    }

    // Create facility + related records in transaction
    await prisma.$transaction(async (tx) => {
      const fac = await tx.facility.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          address: address.trim(),
          postalCode: postalCode?.replace(/\s/g, "") || null,
          locationId: location.id,
          courtsLanes: courtsLanes ? Number(courtsLanes) : null,
          pricing: pricing?.trim() || null,
          openingHours: openingHours?.trim() || null,
          isActive: false, // requires admin approval
          isClaimed: false,
        },
      });

      // Create sport associations
      await tx.facilitySport.createMany({
        data: validSports.map((sport) => ({
          facilityId: fac.id,
          sportId: sport.id,
        })),
      });

      // Create contacts
      const contacts: { type: "PHONE" | "EMAIL" | "WEBSITE"; value: string }[] = [];
      if (phone?.trim()) contacts.push({ type: "PHONE", value: phone.trim() });
      if (email?.trim()) contacts.push({ type: "EMAIL", value: email.trim() });
      if (website?.trim()) contacts.push({ type: "WEBSITE", value: website.trim() });

      if (contacts.length > 0) {
        await tx.contact.createMany({
          data: contacts.map((c) => ({
            facilityId: fac.id,
            type: c.type,
            value: c.value,
            isPrimary: true,
          })),
        });
      }

      // Create edit request for admin review
      // isOwner = false for community contributions (user is not the facility owner)
      await tx.editRequest.create({
        data: {
          facilityId: fac.id,
          submitterName: effectiveName.trim(),
          submitterEmail: effectiveEmail.trim(),
          submitterPhone: submitterPhone?.trim() || null,
          isOwner: false,
          changes: {},
          message: `Nový návrh sportoviště od: ${effectiveName.trim()} (${effectiveEmail.trim()})${session ? " [přihlášený uživatel]" : ""}`,
          status: "PENDING",
        },
      });

      return fac;
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create submission:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat formulář. Zkuste to prosím později." },
      { status: 500 }
    );
  }
}
