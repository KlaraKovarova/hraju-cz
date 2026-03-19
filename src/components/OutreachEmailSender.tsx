"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

interface OutreachEmailSenderProps {
  facilityId: string;
  facilityName: string;
  contactEmail: string | null;
}

export default function OutreachEmailSender({
  facilityId,
  facilityName,
  contactEmail,
}: OutreachEmailSenderProps) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  async function handleSend() {
    if (!contactEmail) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/send-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          ok: true,
          message: `E-mail odeslán na ${data.sentTo}`,
        });
      } else {
        setResult({
          ok: false,
          message: data.error || "Nepodařilo se odeslat e-mail",
        });
      }
    } catch {
      setResult({
        ok: false,
        message: "Chyba při odesílání e-mailu",
      });
    } finally {
      setSending(false);
    }
  }

  if (!contactEmail) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900">
          <Mail className="h-4 w-4 text-emerald-500" />
          Outreach e-mail
        </h3>
        <p className="text-sm text-zinc-400">
          Sportoviště nemá e-mailový kontakt. Přidejte e-mail pro odeslání outreach e-mailu.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900">
        <Mail className="h-4 w-4 text-emerald-500" />
        Outreach e-mail
      </h3>

      <p className="mb-3 text-sm text-zinc-500">
        Odešlete e-mail s výzvou k převzetí profilu na{" "}
        <strong className="text-zinc-700">{contactEmail}</strong> pro{" "}
        <strong className="text-zinc-700">{facilityName}</strong>.
      </p>

      {result && (
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {result.message}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending || (result?.ok ?? false)}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Mail className="h-4 w-4" />
        {sending ? "Odesílám..." : "Odeslat outreach e-mail"}
      </button>
    </div>
  );
}
