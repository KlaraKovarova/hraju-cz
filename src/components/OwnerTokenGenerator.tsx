"use client";

import { useState } from "react";
import { Key, Copy, CheckCircle2 } from "lucide-react";

interface OwnerTokenGeneratorProps {
  facilityId: string;
  facilityName: string;
}

export default function OwnerTokenGenerator({
  facilityId,
  facilityName,
}: OwnerTokenGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/owner-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          ownerEmail: ownerEmail || undefined,
          expiresInDays: 30,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClaimUrl(data.claimUrl);
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (claimUrl) {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900">
        <Key className="h-4 w-4 text-amber-500" />
        Přístup pro vlastníka
      </h3>

      {claimUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            Odkaz pro vlastníka sportoviště <strong>{facilityName}</strong>:
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={claimUrl}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700"
            />
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Zkopírováno" : "Kopírovat"}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Platnost: 30 dní. Pošlete tento odkaz vlastníkovi e-mailem.
          </p>
          <button
            onClick={() => {
              setClaimUrl(null);
              setOwnerEmail("");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            Vygenerovat nový
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            Vygenerujte přístupový odkaz pro vlastníka tohoto sportoviště.
          </p>
          <input
            type="email"
            placeholder="E-mail vlastníka (nepovinné)"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            <Key className="h-4 w-4" />
            {generating ? "Generuji..." : "Vygenerovat přístupový odkaz"}
          </button>
        </div>
      )}
    </div>
  );
}
