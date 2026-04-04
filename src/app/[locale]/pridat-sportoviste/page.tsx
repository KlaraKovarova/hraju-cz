"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AddListingForm from "@/components/AddListingForm";

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export default function PridatSportoviStePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/prihlaseni?redirect=/pridat-sportoviste");
          return;
        }
        setUser(await res.json());
      } catch {
        router.push("/prihlaseni?redirect=/pridat-sportoviste");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-zinc-900"
          >
            hraju
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              .cz
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          >
            Zpět na úvod
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Přidat sportoviště
        </h1>
        <p className="mt-2 text-zinc-500">
          Znáte sportoviště, které u nás chybí? Přidejte ho a pomozte rozšířit
          naši databázi pro všechny sportovce v České republice.
        </p>

        <div className="mt-8">
          <AddListingForm user={user} />
        </div>
      </div>
    </main>
  );
}
