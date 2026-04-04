import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const limit = 30;

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count(),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Kontaktní zprávy</h1>

      <p className="mb-4 text-sm text-zinc-500">
        Celkem {total} zpráv{pages > 1 && ` (strana ${page}/${pages})`}
      </p>

      {messages.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400">
          Žádné zprávy.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-900">{msg.name}</span>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {msg.email}
                    </a>
                    {msg.phone && (
                      <span className="text-sm text-zinc-500">{msg.phone}</span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                    {msg.message}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {new Date(msg.createdAt).toLocaleDateString("cs-CZ")}{" "}
                  {new Date(msg.createdAt).toLocaleTimeString("cs-CZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/messages?page=${page - 1}`}
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
              href={`/admin/messages?page=${page + 1}`}
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
