import Link from "next/link";
import type { Metadata } from "next";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Primary auth gate is src/proxy.ts (runs at the edge and redirects
  // unauthenticated requests to /admin/login for all admin pages except the
  // login page itself). Each admin page also runs its own getAdminSession()
  // check (SIL-627) so sensitive Prisma queries never execute for unauth
  // users even if the proxy is bypassed. If we reach this branch without
  // auth, we must be on /admin/login — render just the raw child (no admin
  // chrome, no KPI counts).
  const isAuthenticated = await getAdminSession();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  let pendingReviewCount = 0;
  let pendingEventCount = 0;
  let pendingTipCount = 0;
  try {
    [pendingReviewCount, pendingEventCount, pendingTipCount] = await Promise.all([
      prisma.review.count({ where: { isApproved: false } }),
      prisma.touristEvent.count({ where: { isActive: false, source: "user" } }),
      prisma.facilityTip.count({ where: { isApproved: false } }),
    ]);
  } catch {
    // DB may be unavailable
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link href="/admin" className="font-bold text-zinc-900 hover:text-indigo-700">
            hraju.cz Admin
          </Link>
          <Link href="/admin/facilities" className="text-sm text-zinc-500 hover:text-zinc-900">
            Sportoviště
          </Link>
          <Link href="/admin/edit-requests" className="text-sm text-zinc-500 hover:text-zinc-900">
            Návrhy úprav
          </Link>
          <Link href="/admin/review" className="text-sm text-zinc-500 hover:text-zinc-900">
            Kontrola
          </Link>
          <Link href="/admin/reviews" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
            Recenze
            {pendingReviewCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {pendingReviewCount}
              </span>
            )}
          </Link>
          <Link href="/admin/tips" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
            Tipy
            {pendingTipCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {pendingTipCount}
              </span>
            )}
          </Link>
          <Link href="/admin/events" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
            Akce
            {pendingEventCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {pendingEventCount}
              </span>
            )}
          </Link>
          <Link href="/admin/users" className="text-sm text-zinc-500 hover:text-zinc-900">
            Uživatelé
          </Link>
          <Link href="/admin/messages" className="text-sm text-zinc-500 hover:text-zinc-900">
            Zprávy
          </Link>
          <Link href="/admin/payments" className="text-sm text-zinc-500 hover:text-zinc-900">
            Platby
          </Link>
          <Link href="/admin/ads" className="text-sm text-zinc-500 hover:text-zinc-900">
            Reklamy
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
              ← Zpět na web
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
