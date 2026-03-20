import { ExternalLink, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";

function kctEventUrl(sourceId: string): string {
  const xid = sourceId.replace("kct-", "");
  return `https://kalendar.kct-db.cz/texty/kalendarakci-detail.php?xid=${xid}`;
}

function formatCzechDate(date: Date): string {
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
  });
}

function getNextWeekend(): { friday: Date; sunday: Date; isThisWeekend: boolean } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // If it's Fri(5), Sat(6), or Sun(0) and before midnight, use this weekend
  let daysToFriday: number;
  let isThisWeekend = false;

  if (day === 5) {
    daysToFriday = 0;
    isThisWeekend = true;
  } else if (day === 6) {
    daysToFriday = -1;
    isThisWeekend = true;
  } else if (day === 0) {
    daysToFriday = -2;
    isThisWeekend = true;
  } else {
    daysToFriday = 5 - day;
  }

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  return { friday, sunday, isThisWeekend };
}

export async function WeekendEvents() {
  const { friday, sunday, isThisWeekend } = getNextWeekend();

  let events;
  try {
    events = await prisma.touristEvent.findMany({
      where: {
        isActive: true,
        dateStart: { lte: sunday },
        OR: [
          { dateEnd: { gte: friday } },
          { dateEnd: null, dateStart: { gte: friday } },
        ],
      },
      orderBy: { dateStart: "asc" },
      take: 8,
    });
  } catch {
    return null;
  }

  if (!events || events.length === 0) return null;

  const title = isThisWeekend
    ? "Turistické akce tento víkend"
    : "Turistické akce příští víkend";

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-zinc-900">
            <Calendar className="h-6 w-6 text-emerald-600" />
            {title}
          </h2>
          <p className="mt-2 text-zinc-500">
            {formatCzechDate(friday)} – {formatCzechDate(sunday)}{" "}
            · Klub českých turistů
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-emerald-200"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">
                  {event.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatCzechDate(event.dateStart)}
                  {event.dateEnd && ` – ${formatCzechDate(event.dateEnd)}`}
                  {" · "}
                  {event.city}
                  {event.region && `, ${event.region}`}
                </p>
              </div>
              <a
                href={kctEventUrl(event.sourceId)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-zinc-200 p-2 text-zinc-400 transition hover:border-emerald-300 hover:text-emerald-600"
                title="Zobrazit detail akce"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[10px] text-zinc-400">
          Zdroj: Kalendář akcí KČT
        </p>
      </div>
    </section>
  );
}
