import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import EventAdminActions from "./EventAdminActions";

type Filter = "all" | "pending" | "active" | "user";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const sp = await searchParams;
  const filter = (sp.filter as Filter) || "all";
  const page = Math.max(1, parseInt(sp.page || "1"));
  const limit = 50;

  const where =
    filter === "pending"
      ? { isActive: false, source: "user" }
      : filter === "active"
        ? { isActive: true }
        : filter === "user"
          ? { source: "user" }
          : {};

  const [events, total, pendingCount] = await Promise.all([
    prisma.touristEvent.findMany({
      where,
      orderBy: { dateStart: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.touristEvent.count({ where }),
    prisma.touristEvent.count({ where: { isActive: false, source: "user" } }),
  ]);

  const pages = Math.ceil(total / limit);

  const filters: { key: Filter; label: string; badge?: number }[] = [
    { key: "all", label: "Vše" },
    { key: "pending", label: "Ke schválení", badge: pendingCount },
    { key: "active", label: "Aktivní" },
    { key: "user", label: "Od uživatelů" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Akce a události</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <a
            key={f.key}
            href={`/admin/events?filter=${f.key}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-indigo-100 text-indigo-700"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.label}
            {f.badge != null && f.badge > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {f.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Stats */}
      <p className="mb-4 text-sm text-zinc-500">
        Celkem {total} událostí{pages > 1 && ` (strana ${page}/${pages})`}
      </p>

      {/* Event list */}
      {events.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Žádné události k zobrazení.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 truncate">
                      {event.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        event.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {event.isActive ? "Aktivní" : "Čeká"}
                    </span>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      {event.source}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                    <span>
                      {new Date(event.dateStart).toLocaleDateString("cs-CZ")}
                      {event.dateEnd &&
                        ` – ${new Date(event.dateEnd).toLocaleDateString("cs-CZ")}`}
                    </span>
                    <span>{event.city}{event.region && `, ${event.region}`}</span>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-zinc-600 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {event.externalUrl && (
                    <a
                      href={event.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
                    >
                      Odkaz na zdroj &rarr;
                    </a>
                  )}
                </div>
                <EventAdminActions
                  eventId={event.id}
                  isActive={event.isActive}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/events?filter=${filter}&page=${page - 1}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              &larr; Předchozí
            </a>
          )}
          <span className="text-sm text-zinc-500">
            {page} / {pages}
          </span>
          {page < pages && (
            <a
              href={`/admin/events?filter=${filter}&page=${page + 1}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Další &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}
