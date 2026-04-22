#!/usr/bin/env python3
"""
1932x828 가로 배너: 제출 로고 + '목요일의 행운'
- 배경: 로고 가장자리에서 샘플한 단색으로 통일(검정/차콜 단차 제거)
- 로고+텍스트를 하나의 그룹으로 가로·세로 중앙 정렬
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1932, 828
# 본문 크림 + 살짝 따뜻한 톤
TEXT_FILL = (236, 230, 210)
TEXT_TRACK = 14  # 글자 간격(px) — 고급스러운 여백
LOGO_MAX_H = 480
LOGO_TEXT_GAP = 72

DEFAULT_LOGO = Path(
    "/Users/hyunsker/.cursor/projects/Users-hyunsker/assets/clover_dark_600-c885681e-e37d-4316-bfb7-247eb4b34a47.png"
)


def edge_mean_rgb(im: Image.Image, strip: int = 12) -> tuple[int, int, int]:
    """로고 PNG 바깥 테두리 픽셀 평균 → 캔버스와 완전히 동일한 배경색."""
    a = np.array(im.convert("RGB"))
    h, w = a.shape[:2]
    s = min(strip, h // 4, w // 4)
    top = a[:s, :, :].reshape(-1, 3)
    bot = a[h - s :, :, :].reshape(-1, 3)
    left = a[:, :s, :].reshape(-1, 3)
    right = a[:, w - s :, :].reshape(-1, 3)
    all_px = np.vstack([top, bot, left, right])
    m = np.round(all_px.mean(axis=0)).astype(int)
    return int(m[0]), int(m[1]), int(m[2])


def load_korean_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/Library/Fonts/AppleGothic.ttf",
    ]
    for p in candidates:
        fp = Path(p)
        if not fp.is_file():
            continue
        try:
            return ImageFont.truetype(str(fp), size, index=0)
        except OSError:
            try:
                return ImageFont.truetype(str(fp), size)
            except OSError:
                continue
    print("한글 폰트를 찾지 못했습니다.", file=sys.stderr)
    return ImageFont.load_default()


def text_width_tracked(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, track: int) -> int:
    if track <= 0:
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0]
    w = 0
    for i, ch in enumerate(text):
        bbox = draw.textbbox((0, 0), ch, font=font)
        w += bbox[2] - bbox[0]
        if i < len(text) - 1:
            w += track
    return w


def draw_text_tracked(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    track: int,
    anchor: str = "lm",
) -> None:
    """anchor lm: (x,y) = 왼쪽·세로중심 기준점."""
    if track <= 0:
        draw.text(xy, text, font=font, fill=fill, anchor=anchor)
        return
    tw = text_width_tracked(draw, text, font, track)
    x0, y0 = xy
    if anchor == "lm":
        cx = x0
        cy = y0
        x = cx
        for i, ch in enumerate(text):
            bbox = draw.textbbox((0, 0), ch, font=font)
            cw = bbox[2] - bbox[0]
            draw.text((x, cy), ch, font=font, fill=fill, anchor="lm")
            x += cw + (track if i < len(text) - 1 else 0)
    else:
        draw.text(xy, text, font=font, fill=fill, anchor=anchor)


def main() -> int:
    logo_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_LOGO
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else (
        Path(__file__).resolve().parents[1] / "public" / "branding" / "banner-1932x828.png"
    )
    if not logo_path.is_file():
        print(f"로고 없음: {logo_path}", file=sys.stderr)
        return 1

    logo_src = Image.open(logo_path).convert("RGBA")
    bg_rgb = edge_mean_rgb(logo_src)
    base = Image.new("RGB", (W, H), bg_rgb)

    lw, lh = logo_src.size
    scale = LOGO_MAX_H / lh
    nw, nh = max(1, int(round(lw * scale))), max(1, int(round(lh * scale)))
    logo = logo_src.resize((nw, nh), Image.Resampling.LANCZOS)

    text = "목요일의 행운"
    font_size = 128
    font = load_korean_font(font_size)
    draw = ImageDraw.Draw(base)

    while font_size >= 80:
        tw = text_width_tracked(draw, text, font, TEXT_TRACK)
        group_w = nw + LOGO_TEXT_GAP + tw
        if group_w <= W - 120:
            break
        font_size -= 6
        font = load_korean_font(font_size)

    tw = text_width_tracked(draw, text, font, TEXT_TRACK)
    group_w = nw + LOGO_TEXT_GAP + tw
    gx0 = (W - group_w) // 2
    ly = (H - nh) // 2

    base_rgba = base.convert("RGBA")
    base_rgba.paste(logo, (gx0, ly), logo)

    draw = ImageDraw.Draw(base_rgba)
    tx = gx0 + nw + LOGO_TEXT_GAP
    cy = H / 2
    draw_text_tracked(draw, (tx, cy), text, font, TEXT_FILL, TEXT_TRACK, anchor="lm")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    base_rgba.convert("RGB").save(out_path, "PNG", optimize=True)
    print(out_path, "BG", bg_rgb)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
