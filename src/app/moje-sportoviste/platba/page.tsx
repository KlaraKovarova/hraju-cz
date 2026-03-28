"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  CheckCircle2,
  Copy,
  ArrowLeft,
  CreditCard,
  QrCode,
  Clock,
} from "lucide-react";

interface PaymentOrder {
  id: string;
  variableSymbol: string;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt?: string;
}

interface PaymentData {
  order: PaymentOrder | null;
  qrDataUrl: string | null;
  spdString: string | null;
  iban: string;
}

export default function PlatbaPage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [data, setData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchPayment();
  }, []);

  async function fetchPayment() {
    try {
      const res = await fetch("/api/owner/iban-payment");
      if (res.status === 401) {
        window.location.href = "/moje-sportoviste";
        return;
      }
      if (!res.ok) throw new Error("Chyba při načítání");
      setData(await res.json());
    } catch {
      setError("Nepodařilo se načíst údaje o platbě");
    } finally {
      setLoading(false);
    }
  }

  async function createOrder() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/iban-payment", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Chyba");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba při vytváření objednávky");
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const order = data?.order;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link
          href="/moje-sportoviste"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na dashboard
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-zinc-900">
          Premium předplatné
        </h1>
        <p className="mb-8 text-sm text-zinc-500">
          999 Kč/rok + 21 % DPH = <strong>1 209 Kč</strong> celkem
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Already confirmed */}
        {order?.status === "confirmed" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <h2 className="mb-1 text-lg font-semibold text-emerald-900">
              Premium je aktivní
            </h2>
            <p className="text-sm text-emerald-700">
              Platba potvrzena{" "}
              {order.confirmedAt &&
                new Date(order.confirmedAt).toLocaleDateString("cs")}
            </p>
          </div>
        )}

        {/* Pending payment */}
        {order?.status === "pending" && data && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Čeká na přijetí platby — objednávka z{" "}
                  {new Date(order.createdAt).toLocaleDateString("cs")}
                </span>
              </div>
            </div>

            {/* QR Code */}
            {data.qrDataUrl && (
              <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6">
                <QrCode className="mb-2 h-5 w-5 text-zinc-400" />
                <p className="mb-4 text-sm font-medium text-zinc-600">
                  Naskenujte QR kód v bankovní aplikaci
                </p>
                <Image
                  src={data.qrDataUrl}
                  alt="SPD QR kód pro platbu"
                  width={250}
                  height={250}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            )}

            {/* Manual transfer details */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">
                Údaje pro ruční převod
              </h3>
              <div className="space-y-3">
                <PaymentDetail
                  label="IBAN"
                  value={data.iban}
                  onCopy={() => copyToClipboard(data.iban, "iban")}
                  isCopied={copied === "iban"}
                />
                <PaymentDetail
                  label="Částka"
                  value={`${order.amount} Kč`}
                  onCopy={() =>
                    copyToClipboard(order.amount.toString(), "amount")
                  }
                  isCopied={copied === "amount"}
                />
                <PaymentDetail
                  label="Variabilní symbol"
                  value={order.variableSymbol}
                  onCopy={() =>
                    copyToClipboard(order.variableSymbol, "vs")
                  }
                  isCopied={copied === "vs"}
                />
                <PaymentDetail
                  label="Zpráva"
                  value="Premium hraju.cz"
                />
              </div>
            </div>

            <p className="text-center text-xs text-zinc-400">
              Po přijetí platby na účet aktivujeme Premium do 24 hodin.
            </p>
          </div>
        )}

        {/* No order yet — show CTA */}
        {!order && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h2 className="mb-2 text-lg font-semibold text-zinc-900">
              Aktivujte Premium pro vaše sportoviště
            </h2>
            <ul className="mb-6 space-y-2 text-left text-sm text-zinc-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Detailní statistiky návštěvnosti
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Přednostní zobrazení ve výsledcích
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Premium odznak na profilu
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Odpovídání na recenze
              </li>
            </ul>
            <button
              onClick={createOrder}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              Zaplatit bankovním převodem — 1 209 Kč/rok
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentDetail({
  label,
  value,
  onCopy,
  isCopied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  isCopied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5">
      <div>
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="font-mono text-sm font-medium text-zinc-900">
          {value}
        </div>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="ml-3 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
          title="Kopírovat"
        >
          {isCopied ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
