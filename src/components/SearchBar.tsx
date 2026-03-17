"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  currentCity?: string;
  sportSlug: string;
}

export function SearchBar({ currentCity, sportSlug }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(currentCity ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/sport/${sportSlug}?city=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/sport/${sportSlug}`);
    }
  }

  function handleClear() {
    setValue("");
    router.push(`/sport/${sportSlug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Hledat podle města (např. Praha, Brno…)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-9 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Hledat
      </button>
    </form>
  );
}
