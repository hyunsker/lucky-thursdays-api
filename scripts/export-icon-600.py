#!/usr/bin/env python3
"""
Crop to clover + stem only (drop white rounded plate & outer grey frame),
then letterbox to exactly 600×600.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

SIZE = 600
# 심볼이 프레임에 너무 붙지 않게 최대 변 길이 (여백 확보)
INNER_MAX = 520
PAD = 16


def dilate2d(m: np.ndarray, passes: int = 2) -> np.ndarray:
    """Include anti-aliased edges around content."""
    out = m.copy()
    for _ in range(passes):
        out = (
            out
            | np.roll(out, 1, 0)
            | np.roll(out, -1, 0)
            | np.roll(out, 1, 1)
            | np.roll(out, -1, 1)
        )
    return out


def content_mask_light(r: np.ndarray, g: np.ndarray, b: np.ndarray, a: np.ndarray) -> np.ndarray:
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    opaque = a > 200

    plain_backdrop = opaque & (lum > 208) & (chroma < 16)
    very_white = opaque & (lum > 242) & (chroma < 28)

    gold = opaque & (r > 130) & (g > 95) & (b < 215) & ((r - b) > 22)
    green = opaque & (g > 82) & ((g >= r + 2) | (g >= b + 4)) & (chroma > 5) & (~very_white)
    saturated = opaque & (chroma > 22) & (lum < 247)

    content = gold | green | saturated
    content &= ~plain_backdrop
    content &= ~very_white
    return content


def content_mask_dark(r: np.ndarray, g: np.ndarray, b: np.ndarray, a: np.ndarray) -> np.ndarray:
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    opaque = a > 200

    near_black = opaque & (mx < 72) & (lum < 52) & (chroma < 38)
    content = opaque & ~near_black
    return content


def bbox_from_mask(m: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(m)
    if len(xs) == 0:
        return 0, m.shape[0] - 1, 0, m.shape[1] - 1
    y0, y1 = ys.min(), ys.max()
    x0, x1 = xs.min(), xs.max()
    return x0, y0, x1, y1


def crop_content(im: Image.Image, dark: bool) -> Image.Image:
    im = im.convert("RGBA")
    arr = np.array(im)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    mask = content_mask_dark(r, g, b, a) if dark else content_mask_light(r, g, b, a)
    mask = dilate2d(mask, 3)
    x0, y0, x1, y1 = bbox_from_mask(mask)
    h, w = arr.shape[0], arr.shape[1]
    x0 = max(0, x0 - PAD)
    y0 = max(0, y0 - PAD)
    x1 = min(w - 1, x1 + PAD)
    y1 = min(h - 1, y1 + PAD)
    return im.crop((x0, y0, x1 + 1, y1 + 1))


def whiten_edge_halo(im: Image.Image) -> Image.Image:
    """회색 바깥과 맞닿던 안티앨리어싱을 순백에 가깝게 정리."""
    arr = np.array(im.convert("RGBA"))
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    halo = (a > 200) & (lum > 234) & (chroma < 13)
    arr[halo, 0] = 255
    arr[halo, 1] = 255
    arr[halo, 2] = 255
    return Image.fromarray(arr)


def fit_canvas(im: Image.Image, canvas_rgb: tuple[int, int, int]) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    scale = min(INNER_MAX / w, INNER_MAX / h)
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    bg = Image.new("RGBA", (SIZE, SIZE), (*canvas_rgb, 255))
    x, y = (SIZE - nw) // 2, (SIZE - nh) // 2
    bg.paste(resized, (x, y), resized)
    return bg


def main() -> int:
    base = Path(__file__).resolve().parents[1] / "public" / "branding"
    jobs = [
        (base / "clover-icon-light.png", base / "clover-icon-light-600.png", (255, 255, 255), False),
        (base / "clover-icon-dark.png", base / "clover-icon-dark-600.png", (15, 15, 15), True),
    ]
    for src, dst, canvas, dark in jobs:
        if not src.is_file():
            print(f"Skip (missing): {src}", file=sys.stderr)
            continue
        cropped = crop_content(Image.open(src), dark=dark)
        if not dark:
            cropped = whiten_edge_halo(cropped)
        out = fit_canvas(cropped, canvas)
        out.save(dst, "PNG")
        print(dst, "crop", cropped.size, "→", out.size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
