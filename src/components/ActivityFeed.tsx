import Link from "next/link";
import { Star, MapPin, Lightbulb, Camera } from "lucide-react";
import type { ActivityItem } from "@/lib/data";

const typeConfig = {
  review: {
    icon: Star,
    label: "napsal/a recenzi",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  checkin: {
    icon: MapPin,
    label: "byl/a tady",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  tip: {
    icon: Lightbulb,
    label: "přidal/a tip",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  photo: {
    icon: Camera,
    label: "přidal/a fotku",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
} as const;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `před ${days} d`;
  return new Date(dateStr).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" });
}

function ActivityEntry({ item }: { item: ActivityItem }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;
  const facilityUrl = item.facility.sport
    ? `/sport/${item.facility.sport}/${item.facility.slug}`
    : "#";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-4 transition hover:border-zinc-200">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-700">
          <span className="font-semibold text-zinc-900">{item.user.name}</span>{" "}
          <span className="text-zinc-500">{config.label}</span>
        </p>
        <Link
          href={facilityUrl}
          className="mt-0.5 block truncate text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {item.facility.name}
        </Link>
        {item.type === "review" && item.data.rating != null && (
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < (item.data.rating as number)
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-200"
                }`}
              />
            ))}
            {item.data.title ? (
              <span className="ml-1 truncate text-xs text-zinc-500">
                {String(item.data.title)}
              </span>
            ) : null}
          </div>
        )}
        {item.type === "tip" && item.data.text ? (
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
            &ldquo;{String(item.data.text)}&rdquo;
          </p>
        ) : null}
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
          <span>{timeAgo(item.date)}</span>
          <span>&middot;</span>
          <span>{item.facility.city}</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ActivityEntry key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
