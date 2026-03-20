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
  const isAuthenticated = await getAdminSession();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  let pendingReviewCount = 0;
  try {
    pendingReviewCount = await prisma.review.count({ where: { isApproved: false } });
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
