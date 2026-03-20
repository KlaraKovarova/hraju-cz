"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get("success");
  const tokenError = searchParams.get("error");
  const redirect = searchParams.get("redirect");

  // If login was successful, redirect after a short delay
  useEffect(() => {
    if (success === "1") {
      const timer = setTimeout(() => {
        router.push(redirect || "/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, redirect, router]);

  // Map error codes to Czech messages
  const errorMessages: Record<string, string> = {
    missing_token: "Chybí přihlašovací odkaz.",
    invalid_token: "Neplatný přihlašovací odkaz.",
    used_token: "Tento odkaz již byl použit. Vyžádejte si nový.",
    expired_token: "Odkaz vypršel. Vyžádejte si nový.",
    server_error: "Nastala chyba serveru. Zkuste to znovu.",
  };

  if (success === "1") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50/50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">
            Jste přihlášeni
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Za okamžik budete přesměrováni...
          </p>
          <Link
            href={redirect || "/"}
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Pokračovat &rarr;
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Nastala chyba. Zkuste to znovu.");
      }
    } catch {
      setError("Nelze se připojit k serveru. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50/50 px-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na hraju.cz
        </Link>

        <div className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-zinc-900">
              hraju<span className="text-emerald-600">.cz</span>
            </span>
            <h1 className="mt-3 text-xl font-bold text-zinc-900">
              Přihlášení
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Zadejte e-mail a pošleme vám přihlašovací odkaz.
            </p>
          </div>

          {tokenError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessages[tokenError] || "Nastala chyba."}
            </div>
          )}

          {sent ? (
            <div className="mt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-zinc-900">
                Zkontrolujte svůj e-mail
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Poslali jsme přihlašovací odkaz na{" "}
                <strong className="text-zinc-700">{email}</strong>.
              </p>
              <p className="mt-3 text-xs text-zinc-400">
                Odkaz je platný 1 hodinu. Nevidíte e-mail? Zkontrolujte spam.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Odeslat znovu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.cz"
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Jméno{" "}
                  <span className="font-normal text-zinc-400">(volitelné)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Novák"
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  "Odesílám..."
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Poslat přihlašovací odkaz
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Přihlášením souhlasíte s{" "}
          <Link
            href="/ochrana-osobnich-udaju"
            className="underline hover:text-zinc-600"
          >
            ochranou osobních údajů
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
