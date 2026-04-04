"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EventAdminActions({
  eventId,
  isActive,
}: {
  eventId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  async function deleteEvent() {
    if (!confirm("Opravdu smazat tuto událost?")) return;
    setLoading(true);
    await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          isActive
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        } disabled:opacity-50`}
      >
        {isActive ? "Deaktivovat" : "Schválit"}
      </button>
      <button
        onClick={deleteEvent}
        disabled={loading}
        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        Smazat
      </button>
    </div>
  );
}
