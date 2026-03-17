import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FacilityForm } from "@/components/FacilityForm";

interface EditFacilityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFacilityPage({ params }: EditFacilityPageProps) {
  const { id } = await params;

  let facility = null;
  try {
    facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        location: true,
        sports: { include: { sport: { select: { slug: true, nameCs: true } } } },
      },
    });
  } catch {
    // DB unavailable
  }

  if (!facility) notFound();

  return (
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
          isActive: facility.isActive,
          isPremium: facility.isPremium,
          sportSlugs: facility.sports.map((s) => s.sport.slug),
        }}
      />
    </div>
  );
}
