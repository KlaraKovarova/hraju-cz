"use client";

// SIL-670 — Pinterest share button wired into all 4 photo lightboxes and
// the "Foto týdne" homepage card. Opens pinterest.com/pin/create/button/
// with the facility/photo page URL and the WATERMARKED download URL so
// any pin leaving our platform carries the hraju.cz brand.

const PINTEREST_PIN_URL = "https://pinterest.com/pin/create/button/";
const SITE_ORIGIN = "https://www.hraju.cz";

interface PinterestShareButtonProps {
  /** UserPhoto.id — used to build the watermarked `/api/photos/:id/download` URL. */
  photoId: string;
  /**
   * Absolute or site-relative URL of the page Pinterest should link the pin to.
   * Relative paths are resolved against the canonical site origin.
   */
  pageUrl: string;
  /** Facility name used in the pin description. */
  facilityName: string;
  /** Czech sport label (e.g. "Ferraty", "Lezení"). */
  sportLabel?: string | null;
  /** Author username/display name (optional). */
  authorName?: string | null;
  /** Extra classes; overrides default chip styling when needed. */
  className?: string;
  /** Compact mode — icon only, no label. */
  compact?: boolean;
}

function toAbsolute(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const path = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${SITE_ORIGIN}${path}`;
}

function buildDescription(
  facilityName: string,
  sportLabel?: string | null,
  authorName?: string | null,
): string {
  const parts: string[] = [facilityName];
  if (sportLabel) parts.push(sportLabel);
  if (authorName) parts.push(`foto: @${authorName}`);
  parts.push("hraju.cz");
  return parts.join(" • ");
}

export function buildPinterestShareUrl(opts: {
  photoId: string;
  pageUrl: string;
  facilityName: string;
  sportLabel?: string | null;
  authorName?: string | null;
}): string {
  const mediaUrl = toAbsolute(`/api/photos/${opts.photoId}/download`);
  const pageAbs = toAbsolute(opts.pageUrl);
  const description = buildDescription(
    opts.facilityName,
    opts.sportLabel,
    opts.authorName,
  );
  const params = new URLSearchParams({
    url: pageAbs,
    media: mediaUrl,
    description,
  });
  return `${PINTEREST_PIN_URL}?${params.toString()}`;
}

export function PinterestShareButton({
  photoId,
  pageUrl,
  facilityName,
  sportLabel,
  authorName,
  className,
  compact = false,
}: PinterestShareButtonProps) {
  const href = buildPinterestShareUrl({
    photoId,
    pageUrl,
    facilityName,
    sportLabel,
    authorName,
  });

  const base =
    className ??
    "inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-white hover:bg-white/25";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Sdílet fotku ${facilityName} na Pinterest`}
      className={base}
      data-pin-do="none"
      onClick={(e) => e.stopPropagation()}
    >
      <PinterestIcon className="h-3.5 w-3.5" />
      {!compact && <span>Pinterest</span>}
    </a>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 11.998-5.367 11.998-12C24.015 5.367 18.647 0 12.017 0z" />
    </svg>
  );
}
