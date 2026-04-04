"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, User, Building2 } from "lucide-react";

interface EditRequest {
  id: string;
  facilityId: string;
  facility: { id: string; name: string; slug: string };
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  isOwner: boolean;
  changes: Record<string, string>;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

const STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

const STATUS_LABELS = {
  PENDING: "Čeká na posouzení",
  APPROVED: "Schváleno",
  REJECTED: "Zamítnuto",
};

const CHANGE_LABELS: Record<string, string> = {
  name: "Název",
  address: "Adresa",
  phone: "Telefon",
  email: "E-mail",
  website: "Web",
  openingHours: "Otevírací doba",
  pricing: "Ceník",
  description: "Popis",
};

export default function AdminEditRequests() {
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [filter, setFilter] = useState<string>("PENDING");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/edit-requests${filter ? `?status=${filter}` : ""}`
      );
      if (res.ok) setRequests(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string, status: "APPROVED" | "REJECTED") {
    try {
      const res = await fetch(`/api/edit-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      if (res.ok) {
        setReviewingId(null);
        setReviewNote("");
        fetchRequests();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">
        Návrhy úprav sportovišť
      </h1>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", ""].map((s) => (
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
              : s === "PENDING"
                ? "Čekající"
                : s === "APPROVED"
                  ? "Schválené"
                  : "Zamítnuté"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Načítání...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-zinc-500">Žádné návrhy úprav.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="font-semibold text-zinc-900">
                      {req.facility.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {req.submitterName} ({req.submitterEmail})
                    </span>
                    {req.isOwner && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Provozovatel
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(req.createdAt).toLocaleDateString("cs")}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[req.status]}`}
                >
                  {STATUS_LABELS[req.status]}
                </span>
              </div>

              {/* Changes */}
              <div className="mb-3 rounded-xl bg-zinc-50 p-3">
                <div className="mb-1 text-xs font-semibold text-zinc-500">
                  Navrhované změny:
                </div>
                <dl className="space-y-1">
                  {Object.entries(req.changes).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <dt className="shrink-0 font-medium text-zinc-600">
                        {CHANGE_LABELS[key] || key}:
                      </dt>
                      <dd className="text-zinc-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {req.message && (
                <p className="mb-3 text-sm italic text-zinc-600">
                  &ldquo;{req.message}&rdquo;
                </p>
              )}

              {/* Review actions */}
              {req.status === "PENDING" && (
                <>
                  {reviewingId === req.id ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3">
                      <textarea
                        placeholder="Poznámka k posouzení (nepovinné)"
                        rows={2}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(req.id, "APPROVED")}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Schválit
                        </button>
                        <button
                          onClick={() => handleReview(req.id, "REJECTED")}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                          Zamítnout
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setReviewNote("");
                          }}
                          className="px-3 text-sm text-zinc-500 hover:text-zinc-700"
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(req.id)}
                      className="mt-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Posoudit
                    </button>
                  )}
                </>
              )}

              {req.reviewNote && req.status !== "PENDING" && (
                <p className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
                  Poznámka: {req.reviewNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
