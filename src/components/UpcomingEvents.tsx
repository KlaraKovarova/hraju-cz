import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";

function kctEventUrl(sourceId: string): string {
  const xid = sourceId.replace("kct-", "");
  return `https://kalendar.kct-db.cz/texty/kalendarakci-detail.php?xid=${xid}`;
}

interface UpcomingEventsProps {
  city: string;
  region?: string | null;
}

function formatCzechDate(date: Date): string {
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export async function UpcomingEvents({ city, region }: UpcomingEventsProps) {
  let events;
  try {
    events = await prisma.touristEvent.findMany({
      where: {
        isActive: true,
        dateStart: { gte: new Date() },
        OR: [
          { city: { contains: city, mode: "insensitive" } },
          ...(region ? [{ region: { contains: region, mode: "insensitive" as const } }] : []),
        ],
      },
      orderBy: { dateStart: "asc" },
      take: 5,
    });
  } catch {
    return null;
  }

  if (!events || events.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <span>🥾</span>
          Turistické akce v okolí
        </h3>
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {event.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatCzechDate(event.dateStart)}
                  {event.dateEnd && ` – ${formatCzechDate(event.dateEnd)}`}
                  {" · "}
                  {event.city}
                </p>
              </div>
              <a
                href={kctEventUrl(event.sourceId)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-zinc-400 hover:text-emerald-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-zinc-400">
          Zdroj: Kalendář akcí KČT
        </p>
      </div>
    </section>
  );
}
