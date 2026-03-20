"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut } from "lucide-react";

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export function UserNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [checked, setChecked] = useState(false);

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  return (
    <div className="flex items-center justify-end px-4 py-1.5 text-xs text-zinc-500">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3">
        {user ? (
          <>
            <span className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              {user.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Odhlásit
            </button>
          </>
        ) : (
          <Link
            href={`/prihlaseni?redirect=${encodeURIComponent(pathname)}`}
            className="flex items-center gap-1 text-zinc-400 hover:text-emerald-600 transition-colors"
          >
            <User className="h-3 w-3" />
            Přihlásit se
          </Link>
        )}
      </div>
    </div>
  );
}
