"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MapPinCheck, PlusCircle, ArrowRight, Loader2 } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/prihlaseni");
          return;
        }
        const data = await res.json();
        setUserName(data.name);
      } catch {
        router.push("/prihlaseni");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-3xl">&#127881;</span>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900">
          {userName ? `Ahoj, ${userName}!` : "Ahoj!"}
        </h1>
        <p className="mt-2 text-lg text-zinc-600">
          Tvůj účet na hraju.cz je připravený.
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Co chceš udělat jako první?
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-5 text-left transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Star className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700">
                Napsat první recenzi
              </span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Najdi sportoviště a podělte se o svůj zážitek
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-emerald-500" />
          </Link>

          <Link
            href="/"
            className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-5 text-left transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MapPinCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700">
                Označit navštívené sportoviště
              </span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Klikni &quot;Byl/a jsem tady&quot; na stránce sportoviště
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-emerald-500" />
          </Link>

          <Link
            href="/pridat-sportoviste"
            className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-5 text-left transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700">
                Přidat chybějící sportoviště
              </span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Znáš sportoviště, které u nás chybí? Přidej ho
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-emerald-500" />
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Přeskočit a prohlížet sportoviště &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
