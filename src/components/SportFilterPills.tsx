import Link from "next/link";
import { SPORTS } from "@/lib/sports";

export function SportFilterPills({ activeSport }: { activeSport?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/komunita"
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
          !activeSport
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        }`}
      >
        Vše
      </Link>
      {SPORTS.map((sport) => (
        <Link
          key={sport.slug}
          href={`/komunita?sport=${sport.slug}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activeSport === sport.slug
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <span className="text-base leading-none">{sport.icon}</span>
          {sport.nameCs}
        </Link>
      ))}
    </div>
  );
}
