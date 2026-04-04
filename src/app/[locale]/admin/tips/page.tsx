"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, User, Clock, Building2, Flag } from "lucide-react";

interface Tip {
  id: string;
  facilityId: string;
  facility: { id: string; name: string; slug: string };
  user: { name: string | null; email: string; isSeed: boolean };
  text: string;
  helpful: number;
  flagged: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminTips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTips();
  }, [filter]);

  async function fetchTips() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tips?filter=${filter}`);
      if (res.ok) setTips(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject" | "revoke") {
    try {
      const res = await fetch(`/api/admin/tips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchTips();
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Tipy</h1>

      <div className="mb-6 flex gap-2">
        {[
          { key: "pending", label: "Ke schválení" },
          { key: "approved", label: "Schválené" },
          { key: "flagged", label: "Nahlášené" },
          { key: "all", label: "Vše" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === tab.key
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Načítání...</p>
      ) : tips.length === 0 ? (
        <p className="text-sm text-zinc-500">Žádné tipy.</p>
      ) : (
        <div className="space-y-4">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="font-semibold text-zinc-900">
                      {tip.facility.name}
                    </span>
                    {tip.flagged && (
                      <span className="flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                        <Flag className="h-3 w-3" />
                        nahlášeno
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {tip.user.name || "Anonym"} ({tip.user.email})
                      {tip.user.isSeed && (
                        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          seed
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(tip.createdAt).toLocaleDateString("cs")}
                    </span>
                    {tip.helpful > 0 && (
                      <span className="text-emerald-600">
                        {tip.helpful}x užitečné
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
                {tip.text}
              </p>

              <div className="flex gap-2 border-t border-zinc-100 pt-3">
                {!tip.isApproved ? (
                  <>
                    <button
                      onClick={() => handleAction(tip.id, "approve")}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Schválit
                    </button>
                    <button
                      onClick={() => handleAction(tip.id, "reject")}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Smazat
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleAction(tip.id, "revoke")}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Zrušit schválení
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
