"use client";

import { usePathname } from "next/navigation";
import { SiteSearch } from "@/components/SiteSearch";

export function UserNav() {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="flex items-center justify-end px-4 py-1.5 text-xs text-zinc-500">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <SiteSearch />
      </div>
    </div>
  );
}
