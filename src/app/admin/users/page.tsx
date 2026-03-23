import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

type Filter = "all" | "real" | "seed";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const sp = await searchParams;
  const filter = (sp.filter as Filter) || "all";
  const page = Math.max(1, parseInt(sp.page || "1"));
  const limit = 50;

  const where =
    filter === "real"
      ? { isSeed: false }
      : filter === "seed"
        ? { isSeed: true }
        : {};

  const [users, total, realCount, seedCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { isSeed: false } }),
    prisma.user.count({ where: { isSeed: true } }),
  ]);

  const pages = Math.ceil(total / limit);

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "Vše" },
    { key: "real", label: "Reální", count: realCount },
    { key: "seed", label: "Seed", count: seedCount },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Uživatelé</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <a
            key={f.key}
            href={`/admin/users?filter=${f.key}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-indigo-100 text-indigo-700"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.label}
            {f.count != null && (
              <span className="text-xs opacity-60">({f.count})</span>
            )}
          </a>
        ))}
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        Celkem {total} uživatelů{pages > 1 && ` (strana ${page}/${pages})`}
      </p>

      {users.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Žádní uživatelé.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Jméno</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-600 text-center">Recenze</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Typ</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Registrace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {user.name || <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${
                      user._count.reviews > 0
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-zinc-100 text-zinc-400"
                    }`}>
                      {user._count.reviews}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isSeed ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                        Seed
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Reálný
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(user.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/users?filter=${filter}&page=${page - 1}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              &larr; Předchozí
            </a>
          )}
          <span className="text-sm text-zinc-500">
            {page} / {pages}
          </span>
          {page < pages && (
            <a
              href={`/admin/users?filter=${filter}&page=${page + 1}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Další &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}
