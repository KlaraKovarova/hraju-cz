import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTotalFacilityCount } from "@/lib/data";

async function getViewStats() {
  try {
    const result = await prisma.$queryRaw<[{
      viewsToday: bigint;
      viewsYesterday: bigint;
      viewsThisWeek: bigint;
      viewsLastWeek: bigint;
      viewsThisMonth: bigint;
      viewsLastMonth: bigint;
      totalViews: bigint;
    }]>`
      SELECT
        COALESCE(SUM(CASE WHEN "date" = CURRENT_DATE THEN "views" END), 0) AS "viewsToday",
        COALESCE(SUM(CASE WHEN "date" = CURRENT_DATE - 1 THEN "views" END), 0) AS "viewsYesterday",
        COALESCE(SUM(CASE WHEN "date" >= date_trunc('week', CURRENT_DATE) THEN "views" END), 0) AS "viewsThisWeek",
        COALESCE(SUM(CASE WHEN "date" >= date_trunc('week', CURRENT_DATE) - 7 AND "date" < date_trunc('week', CURRENT_DATE) THEN "views" END), 0) AS "viewsLastWeek",
        COALESCE(SUM(CASE WHEN "date" >= date_trunc('month', CURRENT_DATE) THEN "views" END), 0) AS "viewsThisMonth",
        COALESCE(SUM(CASE WHEN "date" >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND "date" < date_trunc('month', CURRENT_DATE) THEN "views" END), 0) AS "viewsLastMonth",
        COALESCE(SUM("views"), 0) AS "totalViews"
      FROM "FacilityView"
    `;

    const topFacilities = await prisma.$queryRaw<Array<{
      facilityId: string;
      name: string;
      sport: string;
      views: bigint;
    }>>`
      SELECT fv."facilityId", f."name", f."sport", SUM(fv."views")::bigint AS "views"
      FROM "FacilityView" fv
      JOIN "Facility" f ON f."id" = fv."facilityId"
      WHERE fv."date" >= CURRENT_DATE - 7
      GROUP BY fv."facilityId", f."name", f."sport"
      ORDER BY "views" DESC
      LIMIT 10
    `;

    const row = result[0];
    return {
      viewsToday: Number(row.viewsToday),
      viewsYesterday: Number(row.viewsYesterday),
      viewsThisWeek: Number(row.viewsThisWeek),
      viewsLastWeek: Number(row.viewsLastWeek),
      viewsThisMonth: Number(row.viewsThisMonth),
      viewsLastMonth: Number(row.viewsLastMonth),
      totalViews: Number(row.totalViews),
      topFacilities: topFacilities.map(f => ({
        facilityId: f.facilityId,
        name: f.name,
        sport: f.sport,
        views: Number(f.views),
      })),
    };
  } catch {
    return null;
  }
}

async function getAdminStats() {
  try {
    const result = await prisma.$queryRaw<[{
      totalDbFacilities: bigint;
      activeFacilities: bigint;
      claimedFacilities: bigint;
      premiumFacilities: bigint;
      totalReviews: bigint;
      pendingReviews: bigint;
      approvedReviews: bigint;
      totalUsers: bigint;
      seedUsers: bigint;
      pendingEditRequests: bigint;
      totalContacts: bigint;
      totalEvents: bigint;
      activeEvents: bigint;
      pendingEvents: bigint;
      unapprovedFacilities: bigint;
    }]>`
      SELECT
        (SELECT COUNT(*) FROM "Facility") AS "totalDbFacilities",
        (SELECT COUNT(*) FROM "Facility" WHERE "isActive" = true) AS "activeFacilities",
        (SELECT COUNT(*) FROM "Facility" WHERE "isClaimed" = true) AS "claimedFacilities",
        (SELECT COUNT(*) FROM "Facility" WHERE "isPremium" = true) AS "premiumFacilities",
        (SELECT COUNT(*) FROM "Review") AS "totalReviews",
        (SELECT COUNT(*) FROM "Review" WHERE "isApproved" = false) AS "pendingReviews",
        (SELECT COUNT(*) FROM "Review" WHERE "isApproved" = true) AS "approvedReviews",
        (SELECT COUNT(*) FROM "User") AS "totalUsers",
        (SELECT COUNT(*) FROM "User" WHERE "isSeed" = true) AS "seedUsers",
        (SELECT COUNT(*) FROM "EditRequest" WHERE "status" = 'PENDING') AS "pendingEditRequests",
        (SELECT COUNT(*) FROM "ContactMessage") AS "totalContacts",
        (SELECT COUNT(*) FROM "TouristEvent") AS "totalEvents",
        (SELECT COUNT(*) FROM "TouristEvent" WHERE "isActive" = true) AS "activeEvents",
        (SELECT COUNT(*) FROM "TouristEvent" WHERE "isActive" = false AND "source" = 'user') AS "pendingEvents",
        (SELECT COUNT(*) FROM "Facility" WHERE "isActive" = true AND "isApproved" = false) AS "unapprovedFacilities"
    `;

    const row = result[0];
    const totalUsers = Number(row.totalUsers);
    const seedUsers = Number(row.seedUsers);

    return {
      totalDbFacilities: Number(row.totalDbFacilities),
      activeFacilities: Number(row.activeFacilities),
      claimedFacilities: Number(row.claimedFacilities),
      premiumFacilities: Number(row.premiumFacilities),
      totalReviews: Number(row.totalReviews),
      pendingReviews: Number(row.pendingReviews),
      approvedReviews: Number(row.approvedReviews),
      totalUsers,
      realUsers: totalUsers - seedUsers,
      seedUsers,
      pendingEditRequests: Number(row.pendingEditRequests),
      totalContacts: Number(row.totalContacts),
      totalEvents: Number(row.totalEvents),
      activeEvents: Number(row.activeEvents),
      pendingEvents: Number(row.pendingEvents),
      unapprovedFacilities: Number(row.unapprovedFacilities),
    };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const [stats, viewStats] = await Promise.all([
    getAdminStats(),
    getViewStats(),
  ]);
  const visibleFacilityCount = getTotalFacilityCount();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Administrace</h1>

      {/* KPI Stats */}
      {stats && (
        <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Sportoviště (DB)" value={stats.totalDbFacilities} sub={`${stats.activeFacilities} aktivních`} />
          <StatCard label="Viditelných na webu" value={visibleFacilityCount} sub={`${stats.claimedFacilities} claimed`} />
          <StatCard label="Premium" value={stats.premiumFacilities} accent={stats.premiumFacilities > 0 ? "emerald" : undefined} />
          <StatCard label="Recenze" value={stats.totalReviews} sub={`${stats.pendingReviews} čeká na schválení`} accent={stats.pendingReviews > 0 ? "amber" : undefined} />
          <StatCard label="Uživatelé" value={stats.totalUsers} sub={`${stats.realUsers} reálných, ${stats.seedUsers} seed`} />
          <StatCard label="Schválené recenze" value={stats.approvedReviews} />
          <StatCard label="Návrhy úprav" value={stats.pendingEditRequests} sub="čekajících" accent={stats.pendingEditRequests > 0 ? "amber" : undefined} />
          <StatCard label="Kontaktní zprávy" value={stats.totalContacts} />
          <StatCard label="Události" value={stats.totalEvents} sub={`${stats.activeEvents} aktivních`} />
          <StatCard label="Čeká na schválení (akce)" value={stats.pendingEvents} accent={stats.pendingEvents > 0 ? "amber" : undefined} />
          <StatCard label="Neschválená sportoviště" value={stats.unapprovedFacilities} accent={stats.unapprovedFacilities > 0 ? "amber" : undefined} />
        </div>
      )}

      {/* Traffic Stats */}
      {viewStats && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-700">Návštěvnost</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <ViewStatCard
              label="Dnes"
              value={viewStats.viewsToday}
              prev={viewStats.viewsYesterday}
              prevLabel="včera"
            />
            <ViewStatCard
              label="Tento týden"
              value={viewStats.viewsThisWeek}
              prev={viewStats.viewsLastWeek}
              prevLabel="minulý týden"
            />
            <ViewStatCard
              label="Tento měsíc"
              value={viewStats.viewsThisMonth}
              prev={viewStats.viewsLastMonth}
              prevLabel="minulý měsíc"
            />
            <StatCard label="Celkem zobrazení" value={viewStats.totalViews} />
          </div>

          {viewStats.topFacilities.length > 0 && (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                <h3 className="text-sm font-semibold text-zinc-700">Top 10 — posledních 7 dní</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Sportoviště</th>
                    <th className="px-4 py-2">Sport</th>
                    <th className="px-4 py-2 text-right">Zobrazení</th>
                  </tr>
                </thead>
                <tbody>
                  {viewStats.topFacilities.map((f, i) => (
                    <tr key={f.facilityId} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="px-4 py-2 text-zinc-400">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-zinc-900">
                        <Link href={`/admin/facilities`} className="hover:underline">
                          {f.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-zinc-500">{f.sport}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-700">{f.views.toLocaleString("cs-CZ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <h2 className="mb-3 text-lg font-semibold text-zinc-700">Správa</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NavCard
          href="/admin/facilities"
          icon="🏟️"
          title="Sportoviště"
          desc="Správa sportovišť — přidat, upravit, smazat"
        />
        <NavCard
          href="/admin/edit-requests"
          icon="📝"
          title="Návrhy úprav"
          desc="Posouzení návrhů od provozovatelů a uživatelů"
          badge={stats?.pendingEditRequests}
        />
        <NavCard
          href="/admin/reviews"
          icon="⭐"
          title="Recenze"
          desc="Schvalování a moderace uživatelských recenzí"
          badge={stats?.pendingReviews}
        />
        <NavCard
          href="/admin/events"
          icon="📅"
          title="Akce a události"
          desc="Správa událostí — schvalování, editace, mazání"
          badge={stats?.pendingEvents}
        />
        <NavCard
          href="/admin/users"
          icon="👥"
          title="Uživatelé"
          desc="Přehled uživatelů — reální vs. seed, aktivita"
        />
        <NavCard
          href="/admin/messages"
          icon="💬"
          title="Kontaktní zprávy"
          desc="Přijaté zprávy z kontaktního formuláře"
          badge={stats?.totalContacts}
        />
        <NavCard
          href="/admin/photos"
          icon="📷"
          title="Fotky uživatelů"
          desc="Moderace fotek z recenzí a check-inů"
        />
        <NavCard
          href="/admin/review"
          icon="🔍"
          title="Kontrola kvality"
          desc="Audit sportovišť — schvalování, telefony, weby"
          badge={stats?.unapprovedFacilities}
        />
        <NavCard
          href="/admin/ads"
          icon="📢"
          title="Reklamy"
          desc="Správa bannerů — zobrazení, kliky, CTR"
        />
        <NavCard
          href="/"
          icon="🌐"
          title="Zobrazit web"
          desc="Otevřít veřejný web hraju.cz"
          external
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: "amber" | "emerald";
}) {
  const accentClasses =
    accent === "amber"
      ? "border-amber-200 bg-amber-50"
      : accent === "emerald"
        ? "border-emerald-200 bg-emerald-50"
        : "border-zinc-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 ${accentClasses}`}>
      <div className="text-2xl font-bold text-zinc-900">{value.toLocaleString("cs-CZ")}</div>
      <div className="text-sm font-medium text-zinc-600">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

function ViewStatCard({
  label,
  value,
  prev,
  prevLabel,
}: {
  label: string;
  value: number;
  prev: number;
  prevLabel: string;
}) {
  const diff = prev > 0 ? Math.round(((value - prev) / prev) * 100) : value > 0 ? 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-2xl font-bold text-zinc-900">{value.toLocaleString("cs-CZ")}</div>
      <div className="text-sm font-medium text-zinc-600">{label}</div>
      <div className="mt-0.5 flex items-center gap-1 text-xs">
        {isUp && <span className="text-emerald-600">+{diff}%</span>}
        {isDown && <span className="text-red-500">{diff}%</span>}
        {!isUp && !isDown && <span className="text-zinc-400">0%</span>}
        <span className="text-zinc-400">vs {prevLabel} ({prev.toLocaleString("cs-CZ")})</span>
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  desc,
  badge,
  external,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  badge?: number;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank" } : {})}
      className="relative rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-sm transition-shadow"
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <h2 className="font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{desc}</p>
      {badge != null && badge > 0 && (
        <span className="absolute top-4 right-4 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
