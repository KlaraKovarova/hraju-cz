"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Banknote,
  Loader2,
} from "lucide-react";

interface PremiumOrder {
  id: string;
  facilityId: string;
  facility: { id: string; name: string; slug: string; isPremium: boolean };
  variableSymbol: string;
  amount: number;
  status: string;
  adminNote: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Čeká na platbu", color: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Potvrzeno", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Zrušeno", color: "bg-red-50 text-red-700" },
};

export default function AdminPayments() {
  const [orders, setOrders] = useState<PremiumOrder[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const url = filter
        ? `/api/admin/payments?status=${filter}`
        : "/api/admin/payments";
      const res = await fetch(url);
      if (res.ok) setOrders(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "confirm" | "cancel") {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote: adminNote || undefined }),
      });
      if (res.ok) {
        setActionId(null);
        setAdminNote("");
        fetchOrders();
      }
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Banknote className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-zinc-900">Platby Premium</h1>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {["pending", "confirmed", "cancelled", ""].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === s
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {s === ""
              ? "Vše"
              : s === "pending"
                ? "Čekající"
                : s === "confirmed"
                  ? "Potvrzené"
                  : "Zrušené"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Načítání...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">Žádné objednávky.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="font-semibold text-zinc-900">
                      {order.facility.name}
                    </span>
                    {order.facility.isPremium && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString("cs")}
                    </span>
                    <span>VS: {order.variableSymbol}</span>
                    <span>{order.amount} Kč</span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[order.status]?.color || "bg-zinc-100 text-zinc-600"}`}
                >
                  {STATUS_CONFIG[order.status]?.label || order.status}
                </span>
              </div>

              {order.adminNote && (
                <p className="mb-3 rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600">
                  Poznámka: {order.adminNote}
                </p>
              )}

              {order.confirmedAt && (
                <p className="mb-3 text-xs text-emerald-600">
                  Potvrzeno: {new Date(order.confirmedAt).toLocaleDateString("cs")}
                </p>
              )}

              {/* Actions for pending orders */}
              {order.status === "pending" && (
                <>
                  {actionId === order.id ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3">
                      <textarea
                        placeholder="Poznámka (nepovinné)"
                        rows={2}
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(order.id, "confirm")}
                          disabled={processing}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Potvrdit platbu
                        </button>
                        <button
                          onClick={() => handleAction(order.id, "cancel")}
                          disabled={processing}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Zrušit
                        </button>
                        <button
                          onClick={() => {
                            setActionId(null);
                            setAdminNote("");
                          }}
                          className="px-3 text-sm text-zinc-500 hover:text-zinc-700"
                        >
                          Zpět
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActionId(order.id)}
                      className="mt-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Posoudit
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
