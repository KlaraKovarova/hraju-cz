import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FacilityForm } from "@/components/FacilityForm";
import OwnerTokenGenerator from "@/components/OwnerTokenGenerator";
import OutreachEmailSender from "@/components/OutreachEmailSender";

interface EditFacilityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFacilityPage({ params }: EditFacilityPageProps) {
  const { id } = await params;

  let facility = null;
  let allAmenities: { id: string; slug: string; nameCs: string; icon: string | null }[] = [];
  try {
    [facility, allAmenities] = await Promise.all([
      prisma.facility.findUnique({
        where: { id },
        include: {
          location: true,
          sports: { include: { sport: { select: { slug: true, nameCs: true } } } },
          amenities: { select: { amenityId: true } },
          contacts: { where: { type: "EMAIL" }, take: 1 },
        },
      }),
      prisma.amenity.findMany({
        select: { id: true, slug: true, nameCs: true, icon: true },
        orderBy: { nameCs: "asc" },
      }),
    ]);
  } catch {
    // DB unavailable
  }

  if (!facility) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Upravit: {facility.name}</h1>
        <FacilityForm
          initialData={{
            id: facility.id,
            name: facility.name,
            slug: facility.slug,
            description: facility.description ?? "",
            address: facility.address,
            postalCode: facility.postalCode ?? "",
            city: facility.location.city,
            region: facility.location.region ?? "",
            courtsLanes: facility.courtsLanes ?? undefined,
            pricing: facility.pricing ?? "",
            website: facility.website ?? "",
            bookingUrl: facility.bookingUrl ?? "",
            isActive: facility.isActive,
            isPremium: facility.isPremium,
            sportSlugs: facility.sports.map((s) => s.sport.slug),
            openingHours: facility.openingHours as Record<string, string> | null,
            amenityIds: facility.amenities.map((a) => a.amenityId),
          }}
          allAmenities={allAmenities}
        />
      </div>
      <OwnerTokenGenerator facilityId={facility.id} facilityName={facility.name} />
      <OutreachEmailSender
        facilityId={facility.id}
        facilityName={facility.name}
        contactEmail={facility.contacts[0]?.value ?? null}
      />
    </div>
  );
}
