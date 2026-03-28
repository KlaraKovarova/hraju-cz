"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Banner {
  id: string;
  imageUrl: string;
  targetUrl: string;
  name: string;
}

interface BannerSlotProps {
  placement: "detail_sidebar" | "listing_inline";
  sport?: string;
  className?: string;
}

const SIZES = {
  detail_sidebar: { width: 300, height: 600 },
  listing_inline: { width: 728, height: 90 },
};

export function BannerSlot({ placement, sport, className }: BannerSlotProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionSent = useRef(false);

  useEffect(() => {
    const url = new URL("/api/banners", window.location.origin);
    url.searchParams.set("placement", placement);
    if (sport) url.searchParams.set("sport", sport);

    fetch(url)
      .then((r) => r.json())
      .then((banners: Banner[]) => {
        if (banners.length > 0) {
          // Pick a random banner if multiple
          setBanner(banners[Math.floor(Math.random() * banners.length)]);
        }
      })
      .catch(() => {});
  }, [placement, sport]);

  // Track impression via IntersectionObserver
  useEffect(() => {
    if (!banner || !containerRef.current || impressionSent.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionSent.current) {
          impressionSent.current = true;
          fetch(`/api/banners/${banner.id}/impression`, { method: "POST" }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [banner]);

  if (!banner) return null;

  const size = SIZES[placement];

  const handleClick = () => {
    fetch(`/api/banners/${banner.id}/click`, { method: "POST" }).catch(() => {});
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", maxWidth: size.width, margin: "0 auto" }}
    >
      <a
        href={banner.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block overflow-hidden rounded-lg border border-zinc-200 transition hover:shadow-md"
      >
        <Image
          src={banner.imageUrl}
          alt={banner.name}
          width={size.width}
          height={size.height}
          className="h-auto w-full"
          unoptimized={banner.imageUrl.startsWith("http")}
        />
      </a>
      <p className="mt-1 text-[10px] text-zinc-400 text-center">Reklama</p>
    </div>
  );
}
