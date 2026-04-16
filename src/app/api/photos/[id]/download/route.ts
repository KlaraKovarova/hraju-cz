import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

// SIL-667 — watermarked download endpoint.
//
// When a user saves a photo (download button, right-click → save), we serve a
// render-time watermarked variant that stamps `hraju.cz/{sport}/{slug}` in the
// bottom-right corner. Originals in blob storage are never modified.
//
// Cache is immutable because the watermark is deterministic for a given photo
// + facility. First request renders, subsequent requests hit the CDN.

export const runtime = "nodejs";

const ABSOLUTE_MAX_BYTES = 20 * 1024 * 1024; // 20MB sanity cap on source fetch

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildWatermarkSvg(text: string, targetWidth: number): Buffer {
  // Scale watermark to ~3.5% of image width for the font size, with sane bounds.
  const fontSize = Math.max(14, Math.min(36, Math.round(targetWidth * 0.028)));
  const padX = Math.round(fontSize * 0.75);
  const padY = Math.round(fontSize * 0.5);
  const safeText = escapeXml(text);
  // A subtle dark pill with white text at 50% opacity, bottom-right via gravity.
  // SVG width is computed generously; sharp composites by gravity, so excess is transparent.
  const estTextWidth = Math.round(safeText.length * fontSize * 0.55);
  const svgWidth = estTextWidth + padX * 2;
  const svgHeight = fontSize + padY * 2;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <style>
    .t { fill: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: ${fontSize}px; }
  </style>
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#000000" fill-opacity="0.45" rx="${Math.round(fontSize * 0.35)}" ry="${Math.round(fontSize * 0.35)}"/>
  <text class="t" x="${padX}" y="${padY + fontSize - Math.round(fontSize * 0.15)}">${safeText}</text>
</svg>`;
  return Buffer.from(svg);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: photoId } = await params;

  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      url: true,
      isHidden: true,
      facility: {
        select: {
          slug: true,
          sports: {
            take: 1,
            select: { sport: { select: { slug: true } } },
          },
        },
      },
    },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Never serve watermarked versions of moderated / hidden content.
  if (photo.isHidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const facilitySlug = photo.facility?.slug ?? null;
  const sportSlug = photo.facility?.sports[0]?.sport.slug ?? null;

  const watermarkText =
    facilitySlug && sportSlug
      ? `hraju.cz/${sportSlug}/${facilitySlug}`
      : facilitySlug
      ? `hraju.cz/${facilitySlug}`
      : "hraju.cz";

  let upstream: Response;
  try {
    upstream = await fetch(photo.url, { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream error" },
      { status: 502 }
    );
  }

  const contentLength = Number(upstream.headers.get("content-length") || 0);
  if (contentLength > ABSOLUTE_MAX_BYTES) {
    return NextResponse.json({ error: "Source too large" }, { status: 413 });
  }

  const arrayBuf = await upstream.arrayBuffer();
  const srcBytes = Buffer.from(arrayBuf);
  if (srcBytes.byteLength > ABSOLUTE_MAX_BYTES) {
    return NextResponse.json({ error: "Source too large" }, { status: 413 });
  }

  let outBytes: Buffer;
  try {
    const base = sharp(srcBytes, { failOn: "none" }).rotate(); // honor EXIF orientation
    const meta = await base.metadata();
    const width = meta.width ?? 1200;
    const svg = buildWatermarkSvg(watermarkText, width);
    outBytes = await base
      .composite([
        {
          input: svg,
          gravity: "southeast",
        },
      ])
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }

  const filenameSlug = facilitySlug || "photo";
  const filename = `hraju-cz-${filenameSlug}-${photo.id}.jpg`;

  // Buffer → ArrayBuffer copy: BodyInit-compatible across Next's Edge/Node types.
  const ab = new ArrayBuffer(outBytes.byteLength);
  new Uint8Array(ab).set(outBytes);
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(outBytes.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Watermark output is deterministic for a given (photoId, facility slug, sport slug).
      // We never reuse IDs, and if a facility is re-slugged the URL changes anyway, so
      // the response can be cached immutably by the CDN.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
