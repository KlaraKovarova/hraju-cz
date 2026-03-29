import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFacilitiesBySport } from "@/lib/data";

async function getFacilities() {
  try {
    return {
      facilities: await prisma.facility.findMany({
        include: {
          location: { select: { city: true } },
          sports: { include: { sport: { select: { nameCs: true, icon: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      isLive: true,
    };
  } catch {
    // Fall back to static data — show a representative sample
    const { facilities } = await getFacilitiesBySport("squash");
    return { facilities, isLive: false };
  }
}

export default async function AdminFacilitiesPage() {
  const { facilities, isLive } = await getFacilities();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sportoviště</h1>
          {!isLive && (
            <p className="mt-1 text-sm text-amber-600">
              Zobrazena ukázková data — databáze není dostupná
            </p>
          )}
        </div>
        {isLive && (
          <Link
            href="/admin/facilities/new"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Přidat sportoviště
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Název</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Město</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Sporty</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              {isLive && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {facilities.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  Žádná sportoviště
                </td>
              </tr>
            )}
            {facilities.map((facility) => (
              <tr key={facility.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {facility.name}
                </td>
                <td className="px-4 py-3 text-zinc-500">{facility.location.city}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {facility.sports.map((s) => (
                    <span key={s.sport.nameCs}>
                      {s.sport.icon} {s.sport.nameCs}{" "}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      facility.isActive
                        ? "bg-green-50 text-green-600"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {facility.isActive ? "Aktivní" : "Neaktivní"}
                  </span>
                </td>
                {isLive && (
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/facilities/${facility.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Upravit
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
