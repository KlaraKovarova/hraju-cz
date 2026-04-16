import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FacilityForm } from "@/components/FacilityForm";
import { getAdminSession } from "@/lib/admin-auth";

export default async function NewFacilityPage() {
  // SIL-627: page-level auth check (defence-in-depth; proxy.ts is primary gate).
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  let allAmenities: { id: string; slug: string; nameCs: string; icon: string | null }[] = [];
  try {
    allAmenities = await prisma.amenity.findMany({
      select: { id: true, slug: true, nameCs: true, icon: true },
      orderBy: { nameCs: "asc" },
    });
  } catch {
    // DB unavailable
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Nové sportoviště</h1>
      <FacilityForm allAmenities={allAmenities} />
    </div>
  );
}
