import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Administrace</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/facilities"
          className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-sm"
        >
          <div className="mb-2 text-2xl">🏟️</div>
          <h2 className="font-semibold text-zinc-900">Sportoviště</h2>
          <p className="mt-1 text-sm text-zinc-500">Správa sportovišť — přidat, upravit, smazat</p>
        </Link>
      </div>
    </div>
  );
}
