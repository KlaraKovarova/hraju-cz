import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTotalFacilityCount } from "@/lib/data";

async function getAdminStats() {
  try {
    const [
      totalDbFacilities,
      activeFacilities,
      claimedFacilities,
      premiumFacilities,
      totalReviews,
      pendingReviews,
      approvedReviews,
      totalUsers,
      seedUsers,
      pendingEditRequests,
      totalContacts,
      totalEvents,
      activeEvents,
      pendingEvents,
    ] = await Promise.all([
      prisma.facility.count(),
      prisma.facility.count({ where: { isActive: true } }),
      prisma.facility.count({ where: { isClaimed: true } }),
      prisma.facility.count({ where: { isPremium: true } }),
      prisma.review.count(),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.review.count({ where: { isApproved: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isSeed: true } }),
      prisma.editRequest.count({ where: { status: "PENDING" } }),
      prisma.contactMessage.count(),
      prisma.touristEvent.count(),
      prisma.touristEvent.count({ where: { isActive: true } }),
      prisma.touristEvent.count({ where: { isActive: false, source: "user" } }),
    ]);

    return {
      totalDbFacilities,
      activeFacilities,
      claimedFacilities,
      premiumFacilities,
      totalReviews,
      pendingReviews,
      approvedReviews,
      totalUsers,
      realUsers: totalUsers - seedUsers,
      seedUsers,
      pendingEditRequests,
      totalContacts,
      totalEvents,
      activeEvents,
      pendingEvents,
    };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats();
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
          href="/admin/review"
          icon="🔍"
          title="Kontrola kvality"
          desc="Audit sportovišť — telefony, weby, souřadnice"
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
