"use client";

import { useMemo } from "react";

const DAY_KEYS = ["po", "út", "st", "čt", "pá", "so", "ne"] as const;
const DAY_LABELS: Record<string, string> = {
  po: "Pondělí",
  út: "Úterý",
  st: "Středa",
  čt: "Čtvrtek",
  pá: "Pátek",
  so: "Sobota",
  ne: "Neděle",
};

// JS getDay: 0=Sunday, 1=Monday, ...
const JS_DAY_TO_KEY: Record<number, string> = {
  1: "po",
  2: "út",
  3: "st",
  4: "čt",
  5: "pá",
  6: "so",
  0: "ne",
};

function parseTime(timeStr: string): { h: number; m: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return { h: parseInt(match[1]), m: parseInt(match[2]) };
}

function isOpenNow(
  hours: Record<string, string>,
): { isOpen: boolean; label: string } {
  const now = new Date();
  const dayKey = JS_DAY_TO_KEY[now.getDay()];
  const todayHours = hours[dayKey];
  if (!todayHours) return { isOpen: false, label: "Zavřeno" };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Handle multiple time ranges (e.g., "9:00–11:00, 16:30–19:30")
  const ranges = todayHours.split(",").map((r) => r.trim());
  for (const range of ranges) {
    const match = range.match(
      /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/,
    );
    if (!match) continue;
    const open = parseTime(match[1]);
    const close = parseTime(match[2]);
    if (!open || !close) continue;
    const openMin = open.h * 60 + open.m;
    const closeMin = close.h * 60 + close.m;
    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      return { isOpen: true, label: "Otevřeno" };
    }
  }

  return { isOpen: false, label: "Zavřeno" };
}

interface OpeningHoursDisplayProps {
  hours: Record<string, string>;
}

export function OpeningHoursDisplay({ hours }: OpeningHoursDisplayProps) {
  const today = JS_DAY_TO_KEY[new Date().getDay()];
  const status = useMemo(() => isOpenNow(hours), [hours]);

  // Check if all weekdays have the same hours for compact display
  const compact = useMemo(() => {
    const values = DAY_KEYS.map((k) => hours[k]).filter(Boolean);
    if (values.length === 0) return null;

    // All same
    if (values.length === 7 && values.every((v) => v === values[0])) {
      return { label: "Po\u2013Ne", hours: values[0] };
    }

    // Weekdays same, weekend same
    const weekday = DAY_KEYS.slice(0, 5)
      .map((k) => hours[k])
      .filter(Boolean);
    const weekend = DAY_KEYS.slice(5)
      .map((k) => hours[k])
      .filter(Boolean);
    if (
      weekday.length === 5 &&
      weekday.every((v) => v === weekday[0]) &&
      weekend.length === 2 &&
      weekend.every((v) => v === weekend[0]) &&
      weekday[0] !== weekend[0]
    ) {
      return {
        label: "compact-split",
        weekday: weekday[0],
        weekend: weekend[0],
      };
    }

    return null;
  }, [hours]);

  return (
    <div>
      {/* Open/Closed Badge */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            status.isOpen
              ? "bg-emerald-50 text-emerald-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status.isOpen ? "bg-emerald-500" : "bg-zinc-400"
            }`}
          />
          {status.label}
        </span>
      </div>

      {/* Compact display */}
      {compact && compact.label !== "compact-split" ? (
        <div className="rounded-xl bg-zinc-50/50 px-4 py-3 text-sm">
          <span className="font-medium text-zinc-600">{compact.label}</span>
          <span className="ml-3 font-semibold text-zinc-900">
            {compact.hours}
          </span>
        </div>
      ) : compact?.label === "compact-split" ? (
        <div className="divide-y divide-zinc-50 rounded-xl bg-zinc-50/50">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="font-medium text-zinc-600">Po\u2013Pá</span>
            <span className="font-semibold text-zinc-900">
              {compact.weekday}
            </span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="font-medium text-zinc-600">So\u2013Ne</span>
            <span className="font-semibold text-zinc-900">
              {compact.weekend}
            </span>
          </div>
        </div>
      ) : (
        /* Full day-by-day display */
        <div className="divide-y divide-zinc-50 rounded-xl bg-zinc-50/50">
          {DAY_KEYS.map((day) => {
            const dayHours = hours[day];
            if (!dayHours) return null;
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`flex justify-between px-4 py-3 text-sm ${
                  isToday
                    ? "bg-emerald-50/50 font-semibold"
                    : ""
                }`}
              >
                <span
                  className={
                    isToday
                      ? "text-emerald-700"
                      : "font-medium text-zinc-600"
                  }
                >
                  {DAY_LABELS[day]}
                  {isToday && (
                    <span className="ml-1.5 text-xs font-normal text-emerald-500">
                      dnes
                    </span>
                  )}
                </span>
                <span
                  className={
                    isToday ? "text-emerald-900" : "font-semibold text-zinc-900"
                  }
                >
                  {dayHours}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
