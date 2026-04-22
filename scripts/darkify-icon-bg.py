#!/usr/bin/env python3
"""Light reference icon → dark mode: replace near-white / off-white background only."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

# Target dark background (app-adjacent)
BG = (15, 15, 15, 255)  # #0f0f0f


def is_background(r: int, g: int, b: int, a: int) -> bool:
    if a < 200:
        return True
    mx, mn = max(r, g, b), min(r, g, b)
    chroma = mx - mn
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # Pure white card + light grey surround: high luminance, low chroma
    if lum >= 248 and chroma <= 8:
        return True
    if lum >= 240 and chroma <= 14:
        return True
    if lum >= 232 and chroma <= 6:
        return True
    # Residual UI line / cool-tinted white shadow
    if mn >= 210 and chroma <= 22 and lum >= 215:
        return True
    if mn >= 200 and chroma <= 18 and lum >= 228:
        return True
    return False


def main() -> int:
    src = Path(
        sys.argv[1]
        if len(sys.argv) > 1
        else "/Users/hyunsker/.cursor/projects/Users-hyunsker/assets/Generated_image-1bef1ca6-441c-4cf6-8727-383a07d058c7.png"
    )
    out = Path(
        sys.argv[2]
        if len(sys.argv) > 2
        else str(Path(__file__).resolve().parents[1] / "public" / "branding" / "clover-icon-dark.png")
    )
    if not src.is_file():
        print(f"Missing source: {src}", file=sys.stderr)
        return 1
    out.parent.mkdir(parents=True, exist_ok=True)

    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_background(r, g, b, a):
                px[x, y] = BG

    im.save(out, "PNG")
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
