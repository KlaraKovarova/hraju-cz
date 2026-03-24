#!/usr/bin/env python3
"""
Create banner ads for medfeet.cz / Joma campaign
SIL-465: 2 sizes — 300x250 (sidebar) and 728x90 (leaderboard)
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Brand colors (Joma)
JOMA_YELLOW = (247, 197, 1)      # #F7C501 — Joma primary yellow
JOMA_BLACK = (15, 15, 15)         # near-black
WHITE = (255, 255, 255)
DARK_BG = (20, 20, 28)            # very dark navy-black
ACCENT_DARK = (35, 35, 45)        # slightly lighter dark
GRAY_TEXT = (190, 190, 190)       # light gray for secondary text

OUTPUT_DIR = "/Users/klara/Weby/hraju.cz/public/images/ads"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Font paths (macOS system fonts)
FONT_AVENIR_NEXT = "/System/Library/Fonts/Avenir Next Condensed.ttc"
FONT_HELVETICA = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_AVENIR = "/System/Library/Fonts/Avenir Next.ttc"


def load_font(path, size, index=0):
    """Load a font, falling back to default if not found."""
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        try:
            return ImageFont.truetype(FONT_HELVETICA, size)
        except Exception:
            return ImageFont.load_default()


def draw_rounded_rect(draw, bbox, radius, fill):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = bbox
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)
    draw.ellipse([x1, y1, x1 + radius * 2, y1 + radius * 2], fill=fill)
    draw.ellipse([x2 - radius * 2, y1, x2, y1 + radius * 2], fill=fill)
    draw.ellipse([x1, y2 - radius * 2, x1 + radius * 2, y2], fill=fill)
    draw.ellipse([x2 - radius * 2, y2 - radius * 2, x2, y2], fill=fill)


def create_300x250():
    """Create sidebar rectangle banner 300×250px."""
    W, H = 300, 250
    img = Image.new("RGB", (W, H), DARK_BG)
    draw = ImageDraw.Draw(img)

    # ── Background gradient effect (stripes of slightly different darkness)
    for y in range(H):
        factor = 1 - (y / H) * 0.15
        r = int(DARK_BG[0] * factor)
        g = int(DARK_BG[1] * factor)
        b = int(DARK_BG[2] * factor + 8 * (1 - y / H))
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # ── Yellow top accent bar
    draw.rectangle([0, 0, W, 4], fill=JOMA_YELLOW)

    # ── Decorative diagonal stripe (sport energy feel)
    for i in range(5):
        x_off = 200 + i * 8
        draw.polygon([
            (x_off, 0), (x_off + 60, 0),
            (x_off + 30, H), (x_off - 30, H)
        ], fill=(255, 255, 255, 10))

    # Re-draw on RGBA for transparency support in stripes
    img2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw2 = ImageDraw.Draw(img2)
    for i in range(4):
        x_off = 180 + i * 25
        draw2.polygon([
            (x_off, 0), (x_off + 50, 0),
            (x_off + 20, H), (x_off - 30, H)
        ], fill=(255, 255, 255, 12))
    img = Image.alpha_composite(img.convert("RGBA"), img2).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── JOMA logo (large bold text)
    font_logo = load_font(FONT_AVENIR_NEXT, 58, index=4)  # Bold/Heavy index
    logo_text = "JOMA"
    bbox = draw.textbbox((0, 0), logo_text, font=font_logo)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 28), logo_text, fill=JOMA_YELLOW, font=font_logo)

    # ── Yellow underline accent under logo
    lw = tw + 20
    lx = (W - lw) // 2
    draw.rectangle([lx, 90, lx + lw, 93], fill=JOMA_YELLOW)

    # ── Tagline
    font_tag = load_font(FONT_AVENIR, 14, index=0)
    tagline = "Sportovní obuv pro každého"
    bbox = draw.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 102), tagline, fill=GRAY_TEXT, font=font_tag)

    # ── Central decorative element — shoe icon using shapes
    # Draw a stylized shoe silhouette from simple shapes
    cx = W // 2
    cy = 155

    # Sole
    draw.ellipse([cx - 55, cy + 18, cx + 55, cy + 35], fill=(50, 50, 60))
    # Upper shoe body
    draw.ellipse([cx - 45, cy - 18, cx + 55, cy + 28], fill=(65, 65, 80))
    # Toe box
    draw.ellipse([cx + 15, cy - 5, cx + 58, cy + 20], fill=(60, 60, 75))
    # Heel
    draw.rectangle([cx - 45, cy - 5, cx - 20, cy + 20], fill=(60, 60, 75))
    # Tongue
    draw.polygon([(cx - 15, cy - 18), (cx + 12, cy - 18), (cx + 8, cy + 5), (cx - 12, cy + 5)], fill=(80, 80, 95))
    # Laces (3 lines)
    for i, lace_y in enumerate([cy - 12, cy - 6, cy]):
        draw.line([(cx - 12 + i * 2, lace_y), (cx + 8 - i * 2, lace_y)], fill=WHITE, width=1)
    # Yellow swoosh/stripe detail
    draw.line([(cx - 40, cy + 10), (cx + 45, cy - 8)], fill=JOMA_YELLOW, width=3)
    draw.line([(cx - 40, cy + 14), (cx + 45, cy - 4)], fill=JOMA_YELLOW, width=2)

    # ── Price/promo text
    font_promo = load_font(FONT_AVENIR, 12, index=0)
    promo = "Kolekce jaro/léto 2026"
    bbox = draw.textbbox((0, 0), promo, font=font_promo)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 188), promo, fill=GRAY_TEXT, font=font_promo)

    # ── CTA Button
    btn_w, btn_h = 200, 36
    btn_x = (W - btn_w) // 2
    btn_y = 205
    draw_rounded_rect(draw, [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], 8, JOMA_YELLOW)

    font_btn = load_font(FONT_AVENIR_NEXT, 16, index=4)
    cta_text = "Nakupovat"
    bbox = draw.textbbox((0, 0), cta_text, font=font_btn)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((btn_x + (btn_w - tw) // 2, btn_y + (btn_h - th) // 2 - 1), cta_text, fill=JOMA_BLACK, font=font_btn)

    # ── Footer domain
    font_small = load_font(FONT_AVENIR, 10, index=0)
    domain = "medfeet.cz"
    bbox = draw.textbbox((0, 0), domain, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 244), domain, fill=(120, 120, 130), font=font_small)

    # ── Border
    draw.rectangle([0, 0, W - 1, H - 1], outline=(50, 50, 60), width=1)

    path = os.path.join(OUTPUT_DIR, "joma-sidebar-300x250.jpg")
    img.save(path, "JPEG", quality=92)
    print(f"Saved: {path}")
    return path


def create_728x90():
    """Create leaderboard banner 728×90px."""
    W, H = 728, 90
    img = Image.new("RGB", (W, H), DARK_BG)
    draw = ImageDraw.Draw(img)

    # ── Background gradient
    for x in range(W):
        factor = 1.0 - (x / W) * 0.12
        r = int(DARK_BG[0] * factor + (1 - factor) * 30)
        g = int(DARK_BG[1] * factor + (1 - factor) * 30)
        b = int(DARK_BG[2] * factor + (1 - factor) * 45)
        draw.line([(x, 0), (x, H)], fill=(r, g, b))

    # ── Left yellow accent column (brand block)
    brand_w = 140
    draw.rectangle([0, 0, brand_w, H], fill=(25, 22, 5))  # very dark yellow-tinted

    # Yellow vertical accent line
    draw.rectangle([brand_w - 3, 0, brand_w, H], fill=JOMA_YELLOW)

    # Top yellow bar
    draw.rectangle([0, 0, W, 3], fill=JOMA_YELLOW)
    # Bottom yellow bar
    draw.rectangle([0, H - 3, W, H], fill=JOMA_YELLOW)

    # ── Diagonal stripe accents (right side energy)
    img2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw2 = ImageDraw.Draw(img2)
    for i in range(6):
        x_off = 480 + i * 20
        draw2.polygon([
            (x_off, 0), (x_off + 18, 0),
            (x_off + 8, H), (x_off - 10, H)
        ], fill=(255, 255, 255, 15))
    img = Image.alpha_composite(img.convert("RGBA"), img2).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── JOMA logo text (left block)
    font_logo = load_font(FONT_AVENIR_NEXT, 34, index=4)
    logo_text = "JOMA"
    bbox = draw.textbbox((0, 0), logo_text, font=font_logo)
    lw, lh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((brand_w - lw) // 2, (H - lh) // 2 - 6), logo_text, fill=JOMA_YELLOW, font=font_logo)

    # ── "sport" sub-label under logo
    font_sub = load_font(FONT_AVENIR, 9, index=0)
    sub_text = "sportovní obuv"
    bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = bbox[2] - bbox[0]
    draw.text(((brand_w - sw) // 2, 58), sub_text, fill=(180, 155, 40), font=font_sub)

    # ── Main tagline (center)
    font_main = load_font(FONT_AVENIR_NEXT, 22, index=2)  # Medium
    main_text = "Kolekce Joma — jaro / léto 2026"
    bbox = draw.textbbox((0, 0), main_text, font=font_main)
    mw = bbox[2] - bbox[0]
    center_x = brand_w + (450 - brand_w) // 2
    draw.text((center_x - mw // 2, 18), main_text, fill=WHITE, font=font_main)

    # ── Sub-tagline
    font_sub2 = load_font(FONT_AVENIR, 13, index=0)
    sub2 = "Boty na tenis, běh, fitness i halové sporty"
    bbox = draw.textbbox((0, 0), sub2, font=font_sub2)
    s2w = bbox[2] - bbox[0]
    draw.text((center_x - s2w // 2, 48), sub2, fill=GRAY_TEXT, font=font_sub2)

    # ── CTA Button (right side)
    btn_w, btn_h = 145, 44
    btn_x = W - btn_w - 18
    btn_y = (H - btn_h) // 2
    draw_rounded_rect(draw, [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], 6, JOMA_YELLOW)

    font_btn = load_font(FONT_AVENIR_NEXT, 16, index=4)
    # Two lines: CTA + domain
    cta = "Zobrazit kolekci"
    bbox = draw.textbbox((0, 0), cta, font=font_btn)
    cw, ch = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((btn_x + (btn_w - cw) // 2, btn_y + 7), cta, fill=JOMA_BLACK, font=font_btn)

    font_domain = load_font(FONT_AVENIR, 10, index=0)
    domain = "medfeet.cz"
    bbox = draw.textbbox((0, 0), domain, font=font_domain)
    dw = bbox[2] - bbox[0]
    draw.text((btn_x + (btn_w - dw) // 2, btn_y + 28), domain, fill=(60, 50, 5), font=font_domain)

    # ── Border
    draw.rectangle([0, 0, W - 1, H - 1], outline=(50, 50, 60), width=1)

    path = os.path.join(OUTPUT_DIR, "joma-leaderboard-728x90.jpg")
    img.save(path, "JPEG", quality=92)
    print(f"Saved: {path}")
    return path


if __name__ == "__main__":
    print("Creating Joma/medfeet.cz banner ads...")
    p1 = create_300x250()
    p2 = create_728x90()
    print(f"\nDone! Files created:")
    print(f"  {p1}  ({os.path.getsize(p1)//1024}KB)")
    print(f"  {p2}  ({os.path.getsize(p2)//1024}KB)")
