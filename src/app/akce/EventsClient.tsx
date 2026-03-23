"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Filter,
  Map,
  List,
} from "lucide-react";
import { FacilityMap } from "@/components/FacilityMap";
import { EventCalendar } from "@/components/EventCalendar";

interface SerializedEvent {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string | null;
  city: string;
  region: string | null;
  description: string | null;
  externalUrl: string | null;
  lat: number | null;
  lng: number | null;
}

interface RegionOption {
  name: string;
  count: number;
}

interface EventsClientProps {
  events: SerializedEvent[];
  regions: RegionOption[];
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatCzechDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
}

function formatCzechDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

const PAGE_SIZE = 20;

export function EventsClient({ events, regions }: EventsClientProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showMap, setShowMap] = useState(false);

  // Calendar event dates
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    for (const e of events) {
      const d = new Date(e.dateStart);
      dates.add(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    }
    return Array.from(dates);
  }, [events]);

  // Filter events
  const filtered = useMemo(() => {
    let result = events;

    if (selectedRegion) {
      result = result.filter((e) => e.region === selectedRegion);
    }

    if (selectedDate) {
      result = result.filter((e) => {
        const d = new Date(e.dateStart);
        const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        return dateStr === selectedDate;
      });
    }

    return result;
  }, [events, selectedRegion, selectedDate]);

  const visible = filtered.slice(0, visibleCount);

  // Map markers — only events with coordinates
  const mapMarkers = useMemo(() => {
    return filtered
      .filter((e): e is SerializedEvent & { lat: number; lng: number } =>
        e.lat !== null && e.lng !== null
      )
      .map((e) => ({
        lat: e.lat,
        lng: e.lng,
        name: e.name,
        address: `${e.city}${e.region ? `, ${e.region}` : ""}`,
        url: e.externalUrl || "#",
      }));
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar: Calendar + Region filter */}
        <aside className="w-full shrink-0 space-y-6 lg:w-72">
          {/* Calendar */}
          <EventCalendar
            eventDates={eventDates}
            month={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={setCurrentMonth}
            onDateSelect={setSelectedDate}
          />

          {/* Region filter */}
          {regions.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
                <Filter className="h-4 w-4 text-zinc-400" />
                Filtr podle kraje
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                    selectedRegion === null
                      ? "bg-emerald-50 font-semibold text-emerald-700"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Všechny kraje
                </button>
                {regions.map((r) => (
                  <button
                    key={r.name}
                    onClick={() =>
                      setSelectedRegion(
                        selectedRegion === r.name ? null : r.name
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition ${
                      selectedRegion === r.name
                        ? "bg-emerald-50 font-semibold text-emerald-700"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-zinc-400">
                      {r.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* View toggle + count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {filtered.length === events.length ? (
                <>
                  <span className="font-semibold text-zinc-900">{filtered.length}</span> akcí
                </>
              ) : (
                <>
                  <span className="font-semibold text-zinc-900">{filtered.length}</span> z {events.length} akcí
                </>
              )}
              {selectedDate && (
                <span className="ml-1 text-zinc-400">
                  {" "}
                  &middot; {formatCzechDateLong(selectedDate + "T00:00:00")}
                </span>
              )}
            </p>
            {mapMarkers.length > 0 && (
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
              >
                {showMap ? (
                  <>
                    <List className="h-4 w-4" />
                    Seznam
                  </>
                ) : (
                  <>
                    <Map className="h-4 w-4" />
                    Mapa
                  </>
                )}
              </button>
            )}
          </div>

          {/* Map view */}
          {showMap && mapMarkers.length > 0 && (
            <div className="mb-6">
              <FacilityMap
                markers={mapMarkers}
                className="h-[400px] w-full rounded-2xl border border-zinc-200 overflow-hidden"
              />
              <p className="mt-2 text-xs text-zinc-400">
                {mapMarkers.length} akcí na mapě
              </p>
            </div>
          )}

          {/* Event list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-zinc-100 bg-white p-12 text-center">
              <Calendar className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-500">
                Žádné akce pro tento výběr
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Zkuste změnit filtr nebo vybrat jiný měsíc
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((event) => (
                <div
                  key={event.id}
                  className="group rounded-xl border border-zinc-100 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-700">
                        {event.name}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          {formatCzechDate(event.dateStart)}
                          {event.dateEnd &&
                            ` – ${formatCzechDate(event.dateEnd)}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                          {event.city}
                          {event.region && (
                            <span className="text-zinc-400">
                              , {event.region}
                            </span>
                          )}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    {event.externalUrl && (
                      <a
                        href={event.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-zinc-200 p-2.5 text-zinc-400 transition hover:border-emerald-300 hover:text-emerald-600"
                        title="Zobrazit detail akce"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {visibleCount < filtered.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800"
              >
                Zobrazit další akce ({filtered.length - visibleCount} zbývá)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
