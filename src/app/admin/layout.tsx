import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/" className="ml-auto text-sm text-zinc-400 hover:text-zinc-600">
            ← Zpět na web
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
