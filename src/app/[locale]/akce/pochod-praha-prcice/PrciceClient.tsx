"use client";

import { useState, useMemo } from "react";
import { Filter } from "lucide-react";

interface Route {
  id: string;
  year: number;
  routeName: string;
  distanceKm: number;
  participants: number;
  mapEmbed: string | null;
}

export default function PrciceClient({ routes }: { routes: Route[] }) {
  const years = useMemo(
    () => [...new Set(routes.map((r) => r.year))].sort((a, b) => b - a),
    [routes]
  );
  const routeNames = useMemo(
    () => [...new Set(routes.map((r) => r.routeName))].sort(),
    [routes]
  );

  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedRoute, setSelectedRoute] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    return routes
      .filter((r) => selectedYear === "all" || r.year === selectedYear)
      .filter((r) => selectedRoute === "all" || r.routeName === selectedRoute)
      .sort((a, b) => b.year - a.year || b.distanceKm - a.distanceKm);
  }, [routes, selectedYear, selectedRoute]);

  const totalParticipants = filtered.reduce((s, r) => s + r.participants, 0);

  return (
    <div>
      {/* Filters */}
      <div className="border-b border-zinc-100 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(e.target.value === "all" ? "all" : parseInt(e.target.value))
              }
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Všechny ročníky</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Všechny trasy</option>
              {routeNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-sm text-zinc-400">
              {filtered.length} záznamů · {totalParticipants.toLocaleString("cs-CZ")} účastníků
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-400 py-12">
            Pro zvolený filtr nejsou dostupná data.
          </p>
        ) : selectedYear !== "all" && selectedRoute !== "all" ? (
          // Single route detail with map
          <SingleRouteDetail route={filtered[0]} />
        ) : selectedYear !== "all" ? (
          // Single year — show all routes as cards
          <YearView routes={filtered} year={selectedYear} />
        ) : (
          // All years — show summary table
          <AllYearsView routes={filtered} years={years} />
        )}
      </div>
    </div>
  );
}

function SingleRouteDetail({ route }: { route: Route }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold text-zinc-900">{route.routeName}</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="text-sm">
            <span className="text-zinc-400">Ročník</span>
            <div className="font-bold text-zinc-900 text-lg">{route.year}</div>
          </div>
          <div className="text-sm">
            <span className="text-zinc-400">Délka</span>
            <div className="font-bold text-zinc-900 text-lg">{route.distanceKm} km</div>
          </div>
          <div className="text-sm">
            <span className="text-zinc-400">Účastníků</span>
            <div className="font-bold text-emerald-600 text-lg">
              {route.participants.toLocaleString("cs-CZ")}
            </div>
          </div>
        </div>
      </div>
      {route.mapEmbed && (
        <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
          <div className="px-4 py-3 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-700">Mapa trasy</span>
          </div>
          <div
            className="w-full [&_iframe]:w-full [&_iframe]:min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: route.mapEmbed }}
          />
        </div>
      )}
    </div>
  );
}

function YearView({ routes, year }: { routes: Route[]; year: number }) {
  const totalParticipants = routes.reduce((s, r) => s + r.participants, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">Ročník {year}</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {routes.length} tras · celkem {totalParticipants.toLocaleString("cs-CZ")} účastníků
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: Route }) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition-colors">
      <div className="font-semibold text-zinc-900">{route.routeName}</div>
      <div className="mt-2 flex gap-4 text-sm">
        <span className="text-zinc-500">{route.distanceKm} km</span>
        <span className="font-medium text-emerald-600">
          {route.participants.toLocaleString("cs-CZ")} účastníků
        </span>
      </div>
      {route.mapEmbed && (
        <div className="mt-3">
          {showMap ? (
            <div>
              <div
                className="rounded-lg overflow-hidden [&_iframe]:w-full [&_iframe]:min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: route.mapEmbed }}
              />
              <button
                onClick={() => setShowMap(false)}
                className="mt-2 text-xs text-zinc-400 hover:text-zinc-600"
              >
                Skrýt mapu
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMap(true)}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Zobrazit mapu trasy →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AllYearsView({ routes, years }: { routes: Route[]; years: number[] }) {
  const byYear = useMemo(
    () =>
      new Map(
        years.map((y) => {
          const yr = routes.filter((r) => r.year === y);
          return [
            y,
            {
              routes: yr,
              total: yr.reduce((s, r) => s + r.participants, 0),
            },
          ];
        })
      ),
    [routes, years]
  );

  return (
    <div>
      {/* Year summary table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-600">Ročník</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-600">Počet tras</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-600">Celkem účastníků</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {years.map((y) => {
              const yd = byYear.get(y)!;
              return (
                <tr key={y} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-semibold text-zinc-900">{y}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{yd.routes.length}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">
                    {yd.total.toLocaleString("cs-CZ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-year route tables */}
      <div className="space-y-8">
        {years.map((y) => {
          const yd = byYear.get(y)!;
          return (
            <div key={y}>
              <h3 className="text-lg font-bold text-zinc-900 mb-3">Ročník {y}</h3>
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Trasa</th>
                      <th className="px-4 py-3 text-right font-semibold text-zinc-600">Délka</th>
                      <th className="px-4 py-3 text-right font-semibold text-zinc-600">Účastníků</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {yd.routes
                      .sort((a, b) => b.distanceKm - a.distanceKm)
                      .map((route) => (
                        <tr key={route.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 text-zinc-900">{route.routeName}</td>
                          <td className="px-4 py-3 text-right text-zinc-500">{route.distanceKm} km</td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600">
                            {route.participants.toLocaleString("cs-CZ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
