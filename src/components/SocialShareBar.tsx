"use client";

import { useState, useEffect } from "react";
import { Share2, Check, Link2 } from "lucide-react";

interface SocialShareBarProps {
  title: string;
  url: string;
  /** Compact mode for inline use (e.g. inside review cards) */
  compact?: boolean;
}

export function SocialShareBar({ title, url, compact = false }: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    setHasNativeShare(!!navigator.share);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-blue-50 hover:text-blue-600"
          title="Sdílet na Facebooku"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
          title="Sdílet na X"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          title={copied ? "Zkopírováno!" : "Kopírovat odkaz"}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {hasNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:shadow-sm"
        >
          <Share2 className="h-5 w-5 text-violet-600" />
          Sdílet
        </button>
      )}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-blue-200 hover:shadow-sm"
      >
        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:shadow-sm"
      >
        <svg className="h-5 w-5 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:shadow-sm"
      >
        {copied ? (
          <>
            <Check className="h-5 w-5 text-emerald-500" />
            Zkopírováno!
          </>
        ) : (
          <>
            <Link2 className="h-5 w-5 text-zinc-500" />
            Kopírovat odkaz
          </>
        )}
      </button>
    </div>
  );
}
