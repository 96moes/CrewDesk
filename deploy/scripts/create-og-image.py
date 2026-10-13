"""Generate the 1200x630 social preview image (og-image.png).

Run once, and again only if the branding changes:

    python create-og-image.py

Writes frontend/public/og-image.png, which Vite copies to the build output as
/og-image.png — the path referenced by og:image and twitter:image.

Pillow here has no libraqm, so Persian text is not shaped automatically. The text is
therefore explicitly reshaped (contextual joining forms) and reordered for RTL before
being drawn.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display

    def rtl(text: str) -> str:
        return get_display(arabic_reshaper.reshape(text))

except ImportError as exc:  # pragma: no cover - build-time helper
    raise SystemExit(
        "Missing Persian text support. Install it with:\n"
        "  python -m pip install arabic-reshaper python-bidi\n"
        f"(import error: {exc})"
    )

WIDTH, HEIGHT = 1200, 630

# Colors from the Tailwind theme in frontend/src/index.css
PRIMARY_800 = (24, 83, 90)
PRIMARY_600 = (39, 126, 135)
PRIMARY_500 = (89, 196, 207)
PRIMARY_100 = (217, 243, 245)

# deploy/scripts/ -> deploy/ -> repository root -> frontend/public/
OUT = (
    Path(__file__).resolve().parent.parent.parent
    / "frontend"
    / "public"
    / "og-image.png"
)

def font_candidates() -> list[str]:
    """Persian-capable fonts, checked in order.

    On Windows, fonts installed for a single user live in LOCALAPPDATA rather than in
    C:\\Windows\\Fonts, so both locations are searched.
    """
    import os

    windows_dirs = [
        os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts"),
        os.path.join(
            os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts"
        ),
    ]
    names = ["Vazirmatn-Bold.ttf", "Vazirmatn.ttf", "Vazir-Bold.ttf", "Vazir.ttf"]

    candidates = [
        os.path.join(directory, name) for directory in windows_dirs for name in names
    ]
    candidates += [
        "/usr/share/fonts/truetype/vazirmatn/Vazirmatn-Bold.ttf",
        "/usr/share/fonts/truetype/vazir/Vazir-Bold.ttf",
        "/Library/Fonts/Vazirmatn-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Tahoma.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
        r"C:\Windows\Fonts\tahomabd.ttf",
    ]
    return candidates


def load_font(size: int):
    for candidate in font_candidates():
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    raise SystemExit(
        "No Persian-capable font found. Install Vazirmatn or Vazir, or add its path to "
        "FONT candidates in this script:\n"
        "  https://github.com/rastikerdar/vazirmatn/releases"
    )


def gradient(size, top, bottom):
    """Vertical gradient, built one row at a time."""
    width, height = size
    image = Image.new("RGB", size)
    draw = ImageDraw.Draw(image)
    for y in range(height):
        ratio = y / max(height - 1, 1)
        color = tuple(round(top[i] + (bottom[i] - top[i]) * ratio) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)
    return image


def main() -> None:
    image = gradient((WIDTH, HEIGHT), PRIMARY_600, PRIMARY_800)

    # Decorative arcs, drawn on a transparent overlay so they can be blended softly.
    # Confined to the outer edges: the text column runs along the visual right, so the
    # rings stay out of the way on the far right and lower left.
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    odraw.ellipse([WIDTH - 120, -300, WIDTH + 320, 140], outline=(*PRIMARY_500, 80), width=3)
    odraw.ellipse([WIDTH - 60, -220, WIDTH + 260, 90], outline=(*PRIMARY_100, 60), width=2)
    odraw.ellipse([-260, HEIGHT - 260, 260, HEIGHT + 200], outline=(*PRIMARY_500, 70), width=3)
    odraw.ellipse([-180, HEIGHT - 180, 180, HEIGHT + 140], outline=(*PRIMARY_100, 50), width=2)

    # Filled circle accents.
    odraw.ellipse([104, 300, 132, 328], fill=(*PRIMARY_500, 255))
    odraw.ellipse([176, 356, 194, 374], fill=(*PRIMARY_100, 120))

    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(image)

    title_font = load_font(96)
    subtitle_font = load_font(40)
    footer_font = load_font(28)

    right_edge = 900

    # The text block is optically centred vertically: title, accent rule, subtitle, tagline.
    # --- Title ---
    title = rtl("قوم سلمان")
    draw.text((right_edge, 186), title, font=title_font, fill=(255, 255, 255), anchor="ra")

    # Accent rule, placed well clear of the descender of "ق".
    draw.rounded_rectangle(
        [right_edge - 118, 330, right_edge, 338], radius=4, fill=PRIMARY_500
    )

    # --- Subtitle ---
    subtitle = rtl("معارف مهدوی، آموزش و فعالیت‌های فرهنگی")
    draw.text(
        (right_edge, 372), subtitle, font=subtitle_font, fill=PRIMARY_100, anchor="ra"
    )

    # --- Tagline ---
    footer = rtl("در مسیر زمینه‌سازی ظهور")
    draw.text(
        (right_edge, 448),
        footer,
        font=footer_font,
        fill=PRIMARY_500,
        anchor="ra",
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} kB, {WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
