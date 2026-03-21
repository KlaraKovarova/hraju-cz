"use client";

import { useEffect, useRef, useState } from "react";

interface Marker {
  lat: number;
  lng: number;
  name: string;
  address: string;
  url: string;
}

interface FacilityMapProps {
  markers: Marker[];
  className?: string;
}

export function FacilityMap({ markers, className }: FacilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (markers.length === 0) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      // Inject Leaflet CSS via <link> tag — dynamic import("…css") is
      // silently dropped by Turbopack, so we load it manually.
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        // Wait for CSS to load before rendering the map
        await new Promise<void>((resolve) => {
          link.onload = () => resolve();
          link.onerror = () => resolve();
        });
      }

      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, { scrollWheelZoom: false });
      mapInstanceRef.current = map;

      const apiKey = process.env.NEXT_PUBLIC_MAPY_CZ_API_KEY;
      const tileUrl = apiKey
        ? `https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${apiKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const attribution = apiKey
        ? '&copy; <a href="https://mapy.cz">Mapy.cz</a>, &copy; <a href="https://www.seznam.cz">Seznam.cz</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
        ...(apiKey ? {} : { subdomains: "abc" }),
      }).addTo(map);

      const icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#059669" stroke="#fff" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const bounds = L.latLngBounds([]);

      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="font-size:13px"><strong><a href="${m.url}" style="color:#059669">${m.name}</a></strong><br/><span style="color:#71717a">${m.address}</span></div>`,
          { maxWidth: 250 }
        );
        bounds.extend([m.lat, m.lng]);
      }

      if (markers.length === 1) {
        map.setView([markers[0].lat, markers[0].lng], 14);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      // Fix blank tiles on initial hydration — container width may not
      // be finalized when L.map() runs during SSR-to-client handoff.
      requestAnimationFrame(() => {
        map.invalidateSize();
      });

      setLoaded(true);
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers]);

  if (markers.length === 0) return null;

  return (
    <div
      ref={mapRef}
      className={
        className ??
        `h-[350px] w-full rounded-2xl border border-zinc-200 ${!loaded ? "bg-zinc-100 animate-pulse" : ""}`
      }
    />
  );
}
