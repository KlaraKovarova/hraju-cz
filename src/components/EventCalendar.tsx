"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface EventCalendarProps {
  /** ISO date strings (YYYY-MM-DD) that have events */
  eventDates: string[];
  /** Currently selected YYYY-MM */
  month: string;
  /** Currently selected date YYYY-MM-DD or null */
  selectedDate: string | null;
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string | null) => void;
}

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function EventCalendar({
  eventDates,
  month,
  selectedDate,
  onMonthChange,
  onDateSelect,
}: EventCalendarProps) {
  const [year, mon] = month.split("-").map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, mon, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const eventDateSet = new Set(eventDates);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    const d = new Date(year, mon - 2, 1);
    onMonthChange(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
    onDateSelect(null);
  }

  function nextMonth() {
    const d = new Date(year, mon, 1);
    onMonthChange(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
    onDateSelect(null);
  }

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Předchozí měsíc"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-sm font-bold text-zinc-900">
          {MONTH_NAMES[mon - 1]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Další měsíc"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-zinc-400">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e-${i}`} className="py-1.5" />;
          }
          const dateStr = `${year}-${pad2(mon)}-${pad2(day)}`;
          const hasEvents = eventDateSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => {
                if (hasEvents) {
                  onDateSelect(isSelected ? null : dateStr);
                }
              }}
              disabled={!hasEvents}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                isSelected
                  ? "bg-emerald-600 font-bold text-white"
                  : isToday
                    ? "font-bold text-emerald-700"
                    : isPast
                      ? "text-zinc-300"
                      : hasEvents
                        ? "font-medium text-zinc-900 hover:bg-emerald-50"
                        : "text-zinc-400"
              } ${hasEvents && !isSelected ? "cursor-pointer" : !hasEvents ? "cursor-default" : ""}`}
            >
              {day}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="mt-3 w-full rounded-lg border border-zinc-100 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50"
        >
          Zobrazit všechny akce
        </button>
      )}
    </div>
  );
}
