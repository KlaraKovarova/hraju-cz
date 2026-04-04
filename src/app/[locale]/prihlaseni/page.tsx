"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, LogIn, UserPlus } from "lucide-react";

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
  const [mode, setMode] = useState<"login" | "register" | "magic-link">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const success = searchParams.get("success");
  const tokenError = searchParams.get("error");
  const redirect = searchParams.get("redirect");
  const isNewUser = searchParams.get("new") === "1";

  useEffect(() => {
    if (success === "1") {
      const timer = setTimeout(() => {
        router.push(isNewUser ? "/vitejte" : (redirect || "/"));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, redirect, isNewUser, router]);

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
            href={isNewUser ? "/vitejte" : (redirect || "/")}
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Pokračovat &rarr;
          </Link>
        </div>
      </main>
    );
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body: Record<string, string> = {
      email: email.trim(),
      password,
    };
    if (mode === "register" && name.trim()) {
      body.name = name.trim();
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(mode === "register" && data.isNewUser ? "/vitejte" : (redirect || "/"));
      } else {
        setError(data.error || "Nastala chyba. Zkuste to znovu.");
      }
    } catch {
      setError("Nelze se připojit k serveru. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
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
        setMagicLinkSent(true);
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
              {mode === "register" ? "Registrace" : "Přihlášení"}
            </h1>
          </div>

          {/* Mode tabs */}
          <div className="mt-4 flex rounded-lg border border-zinc-200 p-0.5">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Přihlášení
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Registrace
            </button>
          </div>

          {tokenError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessages[tokenError] || "Nastala chyba."}
            </div>
          )}

          {mode === "magic-link" ? (
            magicLinkSent ? (
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
                  onClick={() => setMagicLinkSent(false)}
                  className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Odeslat znovu
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="ml-email" className="block text-sm font-medium text-zinc-700">
                    E-mail
                  </label>
                  <input
                    id="ml-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas@email.cz"
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
                  {loading ? "Odesílám..." : (
                    <>
                      <Mail className="h-4 w-4" />
                      Poslat přihlašovací odkaz
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); }}
                  className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Zpět na přihlášení heslem
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                    Jméno
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
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
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
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Heslo
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Alespoň 6 znaků" : "Vaše heslo"}
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
                {loading
                  ? "Odesílám..."
                  : mode === "register"
                    ? "Vytvořit účet"
                    : "Přihlásit se"
                }
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-zinc-400">nebo</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setMode("magic-link"); setError(null); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <Mail className="h-4 w-4" />
                Přihlásit se odkazem přes e-mail
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          {mode === "register"
            ? "Registrací souhlasíte s "
            : "Přihlášením souhlasíte s "}
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
