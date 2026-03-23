"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, X, MapPin, Calendar, BookOpen, Loader2 } from "lucide-react";
import { trackSearchPerformed } from "@/lib/analytics";

interface FacilityResult {
  id: string;
  name: string;
  slug: string;
  city: string;
  sportSlug: string;
  sportName: string;
  averageRating: number | null;
  reviewCount: number;
  isPremium: boolean;
  image: string | null;
}

interface EventResult {
  id: string;
  name: string;
  dateStart: string;
  city: string;
  region: string | null;
  externalUrl: string | null;
}

interface PostResult {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string | null;
}

interface SearchResponse {
  facilities: FacilityResult[];
  events: EventResult[];
  posts: PostResult[];
}

export function SiteSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Debounced fetch
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=3`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setResults(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    trackSearchPerformed(trimmed);
    setOpen(false);
    router.push(`/hledat?q=${encodeURIComponent(trimmed)}`);
  }

  const hasResults =
    results &&
    (results.facilities.length > 0 ||
      results.events.length > 0 ||
      results.posts.length > 0);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 transition-colors focus-within:border-emerald-300 focus-within:ring-1 focus-within:ring-emerald-200">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setOpen(true);
            }}
            placeholder="Hledat..."
            className="w-28 bg-transparent text-xs text-zinc-700 placeholder:text-zinc-400 focus:w-48 focus:outline-none transition-all sm:w-36 sm:focus:w-56"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="shrink-0 text-zinc-300 hover:text-zinc-500"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </form>

      {/* Instant results dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:w-96">
          {loading && !results && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}

          {!loading && results && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">
              Žádné výsledky pro &ldquo;{query.trim()}&rdquo;
            </div>
          )}

          {hasResults && (
            <div className="max-h-96 overflow-y-auto">
              {/* Facilities */}
              {results!.facilities.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    Sportoviště
                  </div>
                  {results!.facilities.map((f) => (
                    <Link
                      key={f.id}
                      href={`/sport/${f.sportSlug}/${f.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-50"
                    >
                      {f.image ? (
                        <img
                          src={f.image}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                          <MapPin className="h-4 w-4 text-emerald-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {f.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {f.city}
                          {f.sportName && ` · ${f.sportName}`}
                          {f.averageRating != null && ` · ${f.averageRating.toFixed(1)}★`}
                        </p>
                      </div>
                      {f.isPremium && (
                        <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                          PRO
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Events */}
              {results!.events.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 border-t border-zinc-100 px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    Akce
                  </div>
                  {results!.events.map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.externalUrl || "#"}
                      target={ev.externalUrl ? "_blank" : undefined}
                      rel={ev.externalUrl ? "noopener noreferrer" : undefined}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {ev.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {new Date(ev.dateStart).toLocaleDateString("cs-CZ", {
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}
                          {ev.city}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Blog */}
              {results!.posts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 border-t border-zinc-100 px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <BookOpen className="h-3 w-3" />
                    Blog
                  </div>
                  {results!.posts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-50"
                    >
                      {post.image ? (
                        <img
                          src={post.image}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                          <BookOpen className="h-4 w-4 text-emerald-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {post.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-zinc-500">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* View all */}
              <Link
                href={`/hledat?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-emerald-600 transition hover:bg-zinc-100"
              >
                <Search className="h-3.5 w-3.5" />
                Zobrazit všechny výsledky
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
