"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

export function OwnerEditButton({ facilityId }: { facilityId: string }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/owner/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.facilityId === facilityId) setIsOwner(true);
      })
      .catch(() => {});
  }, [facilityId]);

  if (!isOwner) return null;

  return (
    <Link
      href="/moje-sportoviste"
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
    >
      <Pencil className="h-4 w-4" />
      Upravit sportoviště
    </Link>
  );
}

export function OwnerUpgradeCTA({
  facilityId,
  isClaimed,
  isPremium,
  isClaimable,
}: {
  facilityId: string;
  isClaimed: boolean;
  isPremium: boolean;
  isClaimable: boolean;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/owner/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.facilityId === facilityId) setIsOwner(true);
      })
      .catch(() => {});
  }, [facilityId]);

  if (!isOwner || !isClaimed || isPremium || !isClaimable) return null;

  return (
    <Link
      href="/pro"
      className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center transition hover:border-amber-300 hover:bg-amber-100"
    >
      <p className="text-sm font-semibold text-amber-800">
        Upgradujte na Premium pro více zákazníků
      </p>
      <p className="mt-1 text-xs text-amber-600">
        Zvýrazněný profil, bez reklam konkurence a statistiky zobrazení.
      </p>
    </Link>
  );
}
