"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, Bell } from "lucide-react";
import { SiteSearch } from "@/components/SiteSearch";

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export function UserNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [checked, setChecked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setChecked(true);
        if (data) {
          fetch("/api/auth/my-notifications")
            .then((res) => (res.ok ? res.json() : null))
            .then((d) => { if (d) setUnreadCount(d.unreadCount); })
            .catch(() => {});
        }
      })
      .catch(() => setChecked(true));
  }, []);

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  if (!checked) return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  return (
    <div className="flex items-center justify-end px-4 py-1.5 text-xs text-zinc-500">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <SiteSearch />
        <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/muj-ucet"
              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
            >
              <User className="h-3 w-3" />
              {user.name || user.email}
            </Link>
            <Link
              href="/muj-ucet"
              className="relative hover:text-emerald-600 transition-colors"
              aria-label="Oznámení"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
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
    </div>
  );
}
