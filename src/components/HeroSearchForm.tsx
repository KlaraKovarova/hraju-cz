"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

interface HeroSearchFormProps {
  sportSlug?: string;
}

export function HeroSearchForm({ sportSlug }: HeroSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const params = new URLSearchParams({ q: trimmed });
    if (sportSlug) params.set("sport", sportSlug);
    router.push(`/hledat?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-emerald-100/50"
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <Search className="h-5 w-5 shrink-0 text-zinc-400" />
        <input
          type="text"
          placeholder="Město nebo název sportoviště..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="m-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Hledat
      </button>
    </form>
  );
}
