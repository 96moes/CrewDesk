"""Generate the CrewDesk favicon and app-icon set.

Run from the frontend directory:

    python scripts/create-favicons.py              # writes into public/
    python scripts/create-favicons.py --preview    # also writes a size sheet to review

Requires Pillow plus the Persian text helpers and fontTools:

    python -m pip install Pillow arabic-reshaper python-bidi fonttools

Why a script instead of committed binaries: the mark must be reproducible when the brand
palette or the letterform changes, and a multi-size .ico cannot be edited by hand.

Design notes
------------
The mark is the Persian letter "ق" — the first letter of "قوم سلمان" — in white on the brand
teal gradient, inside a rounded square. A single glyph survives downscaling far better than a
detailed illustration, and it is immediately readable to the audience this site serves.

16x16 is the constraint that drives every choice: it is the browser-tab size and the point at
which detail disappears. The glyph is therefore large and heavy, and `--preview` emits a sheet
of every size so the result can actually be checked rather than assumed.

The SVG glyph is emitted as a real outline path taken from the font (fontTools), not traced
from a bitmap, so `favicon.svg` stays under a kilobyte and renders crisply at any size without
depending on the viewer having a Persian font installed.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError as exc:  # pragma: no cover - build-time helper
    raise SystemExit(
        "Missing Persian text support. Install it with:\n"
        "  python -m pip install Pillow arabic-reshaper python-bidi fonttools\n"
        f"(import error: {exc})"
    )


def rtl(text: str) -> str:
    """Reshape and reorder Persian text for rendering without libraqm."""
    return get_display(arabic_reshaper.reshape(text))


# --- Brand palette (frontend/src/index.css) ---------------------------------
PRIMARY_500 = (89, 196, 207)  # #59c4cf
PRIMARY_600 = (39, 126, 135)  # #277e87
PRIMARY_700 = (32, 105, 112)  # #206970
PRIMARY_900 = (18, 63, 69)  # #123f45
WHITE = (255, 255, 255)

# Working resolution for the raster icons, downscaled with LANCZOS.
MASTER = 1024

# SVG canvas. Kept equal to MASTER so the raster and vector marks are directly comparable.
VIEWBOX = 1024
CORNER_RADIUS_RATIO = 0.22

# Fraction of the tile the glyph occupies. Larger reads better in a tab; too large and the
# descender of "ق" collides with the tile edge.
GLYPH_BOX_RATIO = 0.62

GLYPH = "ق"

# Isolated form of the glyph. Pillow without libraqm does not do contextual joining, so the
# presentation form is requested explicitly for the raster icons, and the same presentation
# character is what the SVG outline is taken from — keeping the two marks identical.
GLYPH_ISOLATED = "\uFED7"


def font_candidates() -> list[str]:
    """Persian-capable display fonts, bold weights first."""
    windows_dirs = [
        os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts"),
    ]
    names = [
        "Vazirmatn-Bold.ttf",
        "Vazirmatn-Black.ttf",
        "Vazir-Bold.ttf",
        "Vazir.ttf",
        "Vazirmatn.ttf",
    ]

    candidates = [
        os.path.join(directory, name) for directory in windows_dirs for name in names
    ]
    candidates += [
        "/usr/share/fonts/truetype/vazirmatn/Vazirmatn-Bold.ttf",
        "/usr/share/fonts/truetype/vazir/Vazir-Bold.ttf",
        "/Library/Fonts/Vazirmatn-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Tahoma Bold.ttf",
        r"C:\Windows\Fonts\tahomabd.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
    ]
    return candidates


def find_font(explicit: str | None = None) -> str:
    for candidate in [explicit] if explicit else font_candidates():
        if candidate and Path(candidate).exists():
            return candidate
    raise SystemExit(
        "No Persian-capable font found. Install Vazirmatn or Vazir:\n"
        "  https://github.com/rastikerdar/vazirmatn/releases\n"
        "or pass --font /path/to/font.ttf"
    )


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


# --- masks and fills --------------------------------------------------------
def rounded_square_mask(size: int, radius_ratio: float) -> Image.Image:
    """Anti-aliased rounded-square alpha mask, drawn large and downscaled."""
    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size * scale - 1, size * scale - 1],
        radius=int(size * scale * radius_ratio),
        fill=255,
    )
    return mask.resize((size, size), Image.LANCZOS)


def circle_mask(size: int) -> Image.Image:
    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * scale - 1, size * scale - 1], fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    """Vertical gradient, one row at a time."""
    image = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(image)
    for y in range(size):
        ratio = y / max(size - 1, 1)
        color = tuple(round(top[i] + (bottom[i] - top[i]) * ratio) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color)
    return image


def build_master(font_path: str, shape: str = "rounded") -> Image.Image:
    """Render the mark at MASTER resolution, transparent outside the tile shape."""
    base = gradient(MASTER, PRIMARY_500, PRIMARY_700).convert("RGBA")

    # Soft top-left highlight so the tile does not read as flat at large sizes.
    sheen = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    ImageDraw.Draw(sheen).ellipse(
        [-MASTER * 0.25, -MASTER * 0.55, MASTER * 0.85, MASTER * 0.35],
        fill=(255, 255, 255, 26),
    )
    base = Image.alpha_composite(base, sheen)

    # Size the glyph by its own bounding box so the optical weight is consistent regardless
    # of the font's internal metrics.
    box = int(MASTER * GLYPH_BOX_RATIO)
    probe_size = 400
    probe_font = load_font(font_path, probe_size)
    probe = Image.new("L", (probe_size * 3, probe_size * 3), 0)
    ImageDraw.Draw(probe).text(
        (probe_size * 1.5, probe_size * 1.5),
        rtl(GLYPH_ISOLATED),
        font=probe_font,
        fill=255,
        anchor="mm",
    )
    bbox = probe.getbbox()
    if bbox is None:
        raise SystemExit("glyph rendered empty — font or shaping problem")
    glyph_ratio = max(bbox[2] - bbox[0], bbox[3] - bbox[1]) / probe_size
    font = load_font(font_path, max(int(box / glyph_ratio), 8))

    draw = ImageDraw.Draw(base)
    draw.text(
        (MASTER / 2, MASTER / 2),
        rtl(GLYPH_ISOLATED),
        font=font,
        fill=WHITE,
        anchor="mm",
    )

    mask = rounded_square_mask(MASTER, CORNER_RADIUS_RATIO) if shape == "rounded" else circle_mask(MASTER)
    base.putalpha(mask)
    return base


# --- SVG from the font outline ---------------------------------------------
def _glyph_bounds(tt, glyph_set, glyph_name: str):
    """(xMin, yMin, xMax, yMax) in font units, or None for an empty glyph.

    TrueType stores bounds in the `glyf` table; CFF (OpenType-PS) does not, so those fonts
    are measured by drawing the glyph into a BoundsPen.
    """
    if "glyf" in tt:
        glyph = tt["glyf"][glyph_name]
        if glyph.numberOfContours == 0:
            return None
        return (glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax)

    from fontTools.pens.boundsPen import BoundsPen

    pen = BoundsPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.bounds


def glyph_svg_path(font_path: str) -> tuple[str, tuple[float, float, float, float]]:
    """Return (path_data, bounds) for the isolated glyph, in VIEWBOX user units.

    The outline comes from the font itself, so the SVG matches the raster icons exactly and
    needs no tracing heuristics.
    """
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.ttLib import TTFont

    tt = TTFont(font_path, fontNumber=0)
    cmap = tt.getBestCmap()
    glyph_name = cmap.get(ord(GLYPH_ISOLATED)) or cmap.get(ord(GLYPH))
    if glyph_name is None:
        raise SystemExit(f"{font_path} has no mapping for {GLYPH!r}")

    glyph_set = tt.getGlyphSet()
    pen = SVGPathPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    raw_path = pen.getCommands()

    upm = tt["head"].unitsPerEm
    bounds = _glyph_bounds(tt, glyph_set, glyph_name)
    if bounds is None:
        raise SystemExit("glyph has no outline bounds")
    x_min, y_min, x_max, y_max = bounds

    # Uniform scale that fits the glyph's larger dimension into the target box, expressed in
    # user units per font unit. fontTools outlines are in font units, so the division by
    # unitsPerEm has to happen exactly once — doing it here and again in the path transform
    # shrinks the glyph to nothing.
    box = VIEWBOX * GLYPH_BOX_RATIO
    units_per_user_unit = max(x_max - x_min, y_max - y_min) / box

    # Translate in user units, using the same centre-based formula as the raster mark so the
    # SVG and the PNGs place the glyph identically. Font y grows upward and SVG y grows
    # downward, so y is flipped about the vertical centre.
    tx = VIEWBOX / 2 - (x_min + x_max) / 2 / units_per_user_unit
    ty = VIEWBOX / 2 + (y_min + y_max) / 2 / units_per_user_unit

    return _transform_path(raw_path, units_per_user_unit, tx, ty), bounds


def _transform_path(path: str, units_per_user_unit: float, tx: float, ty: float) -> str:
    """Rewrite path data from font units into viewBox user units.

    `units_per_user_unit` converts a font unit into a user unit — it already accounts for the
    font's unitsPerEm — and (tx, ty) are translations in user units. Mixing font units and user
    units here is the classic way to send the glyph off-canvas or shrink it to nothing.

    Handles the command set SVGPathPen emits for TrueType outlines: M, L, H, V, Q, C, Z.
    H and V take a single coordinate while the rest take points, so each is treated
    separately rather than assuming every command is a sequence of x/y pairs.
    """
    import re

    factor = 1 / units_per_user_unit
    px = lambda v: f"{v * factor + tx:.2f}"  # noqa: E731 - x in user units
    py = lambda v: f"{-v * factor + ty:.2f}"  # noqa: E731 - font y is flipped

    token = re.compile(r"([MLHVCQZ])([^MLHVCQZ]*)")
    number = re.compile(r"-?\d+(?:\.\d+)?(?:e-?\d+)?")

    out: list[str] = []
    for command, args in token.findall(path):
        if command == "Z":
            out.append("Z")
            continue

        values = [float(v) for v in number.findall(args)]

        if command in ("H", "V"):
            # A single coordinate per value. The command letter already terminates the
            # previous number, but a space is written anyway so the output is unambiguous.
            axis = px if command == "H" else py
            out.append(command + " ".join(axis(v) for v in values))
            continue

        # SVGPathPen emits absolute x/y pairs for M, L, Q and C.
        if len(values) % 2 != 0:
            raise SystemExit(
                f"unexpected odd coordinate count for '{command}' in glyph path"
            )

        # Each pair needs a separator between x and y: "M10-20" is read by an SVG parser as
        # a single number and silently corrupts every coordinate after it.
        parts = [
            f"{px(values[i])} {py(values[i + 1])}" for i in range(0, len(values), 2)
        ]
        out.append(command + " ".join(parts))

    return "".join(out)


def build_svg(path_data: str) -> str:
    radius = int(VIEWBOX * CORNER_RADIUS_RATIO)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEWBOX} {VIEWBOX}" role="img" aria-label="قوم سلمان">
  <title>قوم سلمان</title>
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#59c4cf"/>
      <stop offset="1" stop-color="#206970"/>
    </linearGradient>
    <clipPath id="tileClip">
      <rect width="{VIEWBOX}" height="{VIEWBOX}" rx="{radius}" ry="{radius}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#tileClip)">
    <rect width="{VIEWBOX}" height="{VIEWBOX}" fill="url(#tile)"/>
    <ellipse cx="{int(VIEWBOX * 0.30)}" cy="{-int(VIEWBOX * 0.10)}" rx="{int(VIEWBOX * 0.55)}" ry="{int(VIEWBOX * 0.45)}" fill="#ffffff" fill-opacity="0.10"/>
    <path d="{path_data}" fill="#ffffff"/>
  </g>
</svg>
"""


# --- outputs ----------------------------------------------------------------
PNG_TARGETS: list[tuple[str, int, str, bool]] = [
    # name, size, variant, opaque (iOS does not honour transparency)
    ("favicon-16x16.png", 16, "rounded", False),
    ("favicon-32x32.png", 32, "rounded", False),
    ("favicon-48x48.png", 48, "rounded", False),
    ("apple-touch-icon.png", 180, "rounded", True),
    ("android-chrome-192x192.png", 192, "rounded", False),
    ("android-chrome-512x512.png", 512, "rounded", False),
]

ICO_SIZES = [16, 24, 32, 48, 64]


def flatten(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGB", image.size, background)
    canvas.paste(image, (0, 0), image)
    return canvas


def write_manifest(public: Path) -> Path:
    """Minimal web app manifest.

    Its practical effect here is the Android home-screen icon and the correct install name.
    This is not a full PWA: there is no service worker and no offline behaviour.
    """
    target = public / "site.webmanifest"
    target.write_text(
        json.dumps(
            {
                "name": "قوم سلمان",
                "short_name": "قوم سلمان",
                "description": "معارف مهدوی، دوره‌های آموزشی و فعالیت‌های فرهنگی",
                "lang": "fa",
                "dir": "rtl",
                "start_url": "/",
                "scope": "/",
                "display": "standalone",
                "background_color": "#f6f9f9",
                "theme_color": "#277e87",
                "icons": [
                    {
                        "src": "/android-chrome-192x192.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "any",
                    },
                    {
                        "src": "/android-chrome-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any",
                    },
                    {
                        "src": "/android-chrome-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "maskable",
                    },
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return target


def write_preview_sheet(masters: dict[str, Image.Image], target: Path) -> Path:
    """Side-by-side sheet of the sizes that matter, for visual review."""
    sizes = [16, 24, 32, 48, 64, 128, 256]
    cell = max(sizes) + 16
    sheet = Image.new(
        "RGBA", (cell * len(sizes), cell * len(masters)), (240, 244, 245, 255)
    )

    for row, master in enumerate(masters.values()):
        for col, size in enumerate(sizes):
            icon = master.resize((size, size), Image.LANCZOS)
            sheet.alpha_composite(
                icon,
                (col * cell + (cell - size) // 2, row * cell + (cell - size) // 2),
            )

    sheet.save(target)
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate CrewDesk favicons.")
    parser.add_argument("--preview", action="store_true", help="write a size-review sheet")
    parser.add_argument(
        "--preview-path",
        default=None,
        help="where to write the review sheet (default: scripts/_favicon-preview.png)",
    )
    parser.add_argument("--font", default=None, help="path to a Persian-capable TTF")
    args = parser.parse_args()

    font_path = find_font(args.font)
    print(f"font: {font_path}")

    public = Path(__file__).resolve().parent.parent / "public"
    public.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    masters = {
        "rounded": build_master(font_path, "rounded"),
        "circle": build_master(font_path, "circle"),
    }

    for name, size, variant, opaque in PNG_TARGETS:
        icon = masters[variant].resize((size, size), Image.LANCZOS)
        if opaque:
            icon = flatten(icon, PRIMARY_700)
        target = public / name
        icon.save(target, "PNG", optimize=True)
        written.append(target)

    # Multi-size .ico. Browsers request /favicon.ico even when an SVG icon is declared, and
    # Windows shortcuts and feed readers use it directly.
    #
    # Pillow must be handed a large source image plus a `sizes` list: it resizes each frame
    # itself. Appending pre-resized frames instead silently produces a single-size file.
    ico = public / "favicon.ico"
    masters["rounded"].save(
        ico, format="ICO", sizes=[(s, s) for s in ICO_SIZES]
    )
    written.append(ico)

    path_data, _ = glyph_svg_path(font_path)
    svg = public / "favicon.svg"
    svg.write_text(build_svg(path_data), encoding="utf-8")
    written.append(svg)

    written.append(write_manifest(public))

    for target in written:
        print(f"wrote {target.relative_to(public.parent)}  ({target.stat().st_size:,} bytes)")

    if args.preview:
        destination = (
            Path(args.preview_path)
            if args.preview_path
            else Path(__file__).resolve().parent / "_favicon-preview.png"
        )
        print(f"wrote {write_preview_sheet(masters, destination)}")


if __name__ == "__main__":
    main()
