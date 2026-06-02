import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import PrciceAdminClient from "./PrciceAdminClient";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function AdminPrcicePage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const routes = await prisma.prciceRoute.findMany({
    orderBy: [{ year: "desc" }, { distanceKm: "desc" }],
  });

  const years = [...new Set(routes.map((r) => r.year))].sort((a, b) => b - a);
  const totalParticipants = routes.reduce((s, r) => s + r.participants, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pochod Praha–Prčice</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {routes.length} tras · {years.length} ročníků ·{" "}
            {totalParticipants.toLocaleString("cs-CZ")} účastníků celkem
          </p>
        </div>
        <Link
          href="/akce/pochod-praha-prcice"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition"
        >
          <ExternalLink className="h-4 w-4" />
          Zobrazit stránku
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Přidat mapu:</strong> Rozbalte ročník, klikněte na „Přidat mapu" u trasy a vložte
        iframe kód z{" "}
        <a
          href="https://mapy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          mapy.com
        </a>
        .
      </div>

      <PrciceAdminClient initialRoutes={routes} />
    </div>
  );
}
