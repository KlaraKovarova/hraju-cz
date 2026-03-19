"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = { title, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:shadow-sm w-full"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      </div>
      {copied ? "Odkaz zkopírován" : "Sdílet"}
    </button>
  );
}
