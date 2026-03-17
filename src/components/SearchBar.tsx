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
    <form
      onSubmit={handleSubmit}
      className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition focus-within:border-emerald-300 focus-within:shadow-md focus-within:shadow-emerald-50"
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          type="text"
          placeholder="Hledat podle města (např. Praha, Brno...)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="m-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none"
      >
        Hledat
      </button>
    </form>
  );
}
