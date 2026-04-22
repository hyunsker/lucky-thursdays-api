#!/usr/bin/env python3
"""
토스 미니앱 스토어 미리보기 PNG 생성
- 세로 636x1048 최소 3장 (입력 / 로딩 / 결과)
- 가로 1504x741 1장
앱 UI 색상(Input/Loading/Result) 기준.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# 앱과 동일 HEX
BG = (15, 15, 15)
CARD = (26, 26, 26)
BORDER = (42, 42, 42)
MAIN = (240, 234, 214)
SUB = (136, 136, 136)
HINT = (85, 85, 85)
GOLD = (201, 168, 76)
BTN_TEXT = (15, 15, 15)
CARD_INNER = (20, 20, 20)

PW, PH = 636, 1048
LW, LH = 1504, 741
INSET = 32


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for p in (
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    ):
        if Path(p).is_file():
            try:
                return ImageFont.truetype(p, size, index=0)
            except OSError:
                try:
                    return ImageFont.truetype(p, size)
                except OSError:
                    pass
    return ImageFont.load_default()


def rr(draw: ImageDraw.ImageDraw, box: tuple, r: int, fill, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def center_x(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, w: int, y: int, fill) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, y), text, font=font, fill=fill)


def portrait_input(out: Path) -> None:
    im = Image.new("RGB", (PW, PH), BG)
    d = ImageDraw.Draw(im)
    f_sm = load_font(11)
    f_t = load_font(30)
    f_sub = load_font(14)
    f_lbl = load_font(12)
    f_btn = load_font(16)
    f_dd = load_font(14)

    center_x(d, "THURSDAY · FORTUNE", f_sm, PW, 52, GOLD)
    center_x(d, "목요일의 행운", f_t, PW, 88, MAIN)
    sub = "생년월일과 시간을 알려주시면\n이번 주 행운번호를 뽑아 드려요"
    y = 138
    for line in sub.split("\n"):
        center_x(d, line, f_sub, PW, y, SUB)
        y += 22

    cx0, cx1 = INSET, PW - INSET
    cy0, cy1 = 210, 920
    rr(d, (cx0, cy0, cx1, cy1), 16, CARD, outline=BORDER, width=1)

    y = cy0 + 36
    d.text((cx0 + 28, y), "생년월일", font=f_lbl, fill=HINT)
    y += 34
    gap = 8
    bw = (cx1 - cx0 - 56 - gap * 2) // 3
    h_row = 48
    for i, label in enumerate(["2001년 ▼", "1월 ▼", "1일 ▼"]):
        x = cx0 + 28 + i * (bw + gap)
        rr(d, (x, y, x + bw, y + h_row), 10, (20, 20, 20), outline=BORDER, width=1)
        bbox = d.textbbox((0, 0), label, font=f_dd)
        tw = bbox[2] - bbox[0]
        d.text((x + (bw - tw) // 2, y + 14), label, font=f_dd, fill=MAIN)
    y += h_row + 32
    d.text((cx0 + 28, y), "태어난 시간", font=f_lbl, fill=HINT)
    y += 34
    rr(d, (cx0 + 28, y, cx1 - 28, y + h_row), 10, (20, 20, 20), outline=BORDER, width=1)
    center_x(d, "모름 ▼", f_dd, PW, y + 14, MAIN)
    y += h_row + 44
    rr(d, (cx0 + 28, y, cx1 - 28, y + 56), 16, GOLD, outline=None)
    center_x(d, "행운번호 뽑기", f_btn, PW, y + 16, BTN_TEXT)

    im.save(out, "PNG", optimize=True)
    print(out)


def portrait_loading(out: Path) -> None:
    im = Image.new("RGB", (PW, PH), BG)
    d = ImageDraw.Draw(im)
    f_t = load_font(19)
    f_s = load_font(15)
    cx, cy = PW // 2, PH // 2 - 40
    r = 28
    d.arc((cx - r, cy - r, cx + r, cy + r), start=200, end=520, fill=GOLD, width=4)
    d.arc((cx - r, cy - r, cx + r, cy + r), start=30, end=170, fill=BORDER, width=4)
    center_x(d, "사주를 분석하고 있어요...", f_t, PW, cy + r + 24, GOLD)
    center_x(d, "잠시만 기다려 주세요", f_s, PW, cy + r + 56, SUB)
    im.save(out, "PNG", optimize=True)
    print(out)


def portrait_result(out: Path) -> None:
    im = Image.new("RGB", (PW, PH), BG)
    d = ImageDraw.Draw(im)
    f_date = load_font(13)
    f_pill = load_font(10)
    f_pt = load_font(22)
    f_grp = load_font(15)
    f_dig = load_font(40)
    f_hint = load_font(11)
    f_bdg = load_font(11)
    f_sec = load_font(13)
    f_body = load_font(14)
    f_small = load_font(12)

    y = 36
    center_x(d, "2026년 4월 3일 금요일", f_date, PW, y, SUB)
    y += 36
    pill = "CLAUDE AI · 사주 분석"
    bbox = d.textbbox((0, 0), pill, font=f_pill)
    pw = bbox[2] - bbox[0] + 24
    px0 = (PW - pw) // 2
    rr(d, (px0, y, px0 + pw, y + 28), 14, CARD, outline=BORDER, width=1)
    d.text((px0 + 12, y + 8), pill, font=f_pill, fill=SUB)
    y += 44
    center_x(d, "오늘의 행운번호", f_pt, PW, y, MAIN)
    y += 40
    mx0, mx1 = INSET, PW - INSET
    rr(d, (mx0, y, mx1, y + 168), 16, CARD, outline=BORDER, width=1)
    y += 22
    center_x(d, "3조", f_grp, PW, y, GOLD)
    y += 32
    center_x(d, "1 2 8 4 0 7", f_dig, PW, y, MAIN)
    y += 48
    center_x(d, "연금복권 형식: 조(1~5) + 여섯 칸(각 0~9)", f_hint, PW, y, SUB)
    y += 22
    bbox = d.textbbox((0, 0), "매주 목요일 추첨", font=f_bdg)
    bw = bbox[2] - bbox[0] + 28
    bx0 = (PW - bw) // 2
    rr(d, (bx0, y, bx0 + bw, y + 30), 14, CARD_INNER, outline=BORDER, width=1)
    d.text((bx0 + 14, y + 8), "매주 목요일 추첨", font=f_bdg, fill=SUB)
    y += 40
    bx0, bx1 = INSET, PW - INSET
    rr(d, (bx0, y, bx1, y + 92), 16, CARD, outline=BORDER, width=1)
    center_x(d, "번호가 나온 이유", f_sec, PW, y + 14, GOLD)
    reason = "오늘은 흐름이 부드러운 날이에요.\n화 기운을 살려 작은 계획을 세워 보기 좋아요."
    yy = y + 38
    for line in reason.split("\n"):
        center_x(d, line, f_small, PW, yy, SUB)
        yy += 20
    y += 104
    rr(d, (bx0, y, bx1, y + 82), 16, CARD, outline=BORDER, width=1)
    center_x(d, "오늘의 운세", f_sec, PW, y + 12, GOLD)
    yy = y + 36
    center_x(d, "지출은 가볍게, 마음은 여유 있게.", f_body, PW, yy, SUB)
    yy += 22
    center_x(d, "작은 저축이나 정리가 눈에 띄는 하루예요.", f_body, PW, yy, SUB)
    y += 96
    gw = (bx1 - bx0 - 12) // 2
    rr(d, (bx0, y, bx0 + gw, y + 72), 14, CARD, outline=BORDER, width=1)
    rr(d, (bx0 + gw + 12, y, bx1, y + 72), 14, CARD, outline=BORDER, width=1)
    d.text((bx0 + 14, y + 10), "오행", font=f_pill, fill=HINT)
    d.text((bx0 + 14, y + 30), "오행 토(土)", font=load_font(14), fill=MAIN)
    d.text((bx0 + gw + 22, y + 10), "년주", font=f_pill, fill=HINT)
    d.text((bx0 + gw + 22, y + 30), "경진", font=load_font(14), fill=MAIN)
    y += 84
    center_x(d, "용신 화 기운이 도움이 될 수 있어요.", f_small, PW, y, SUB)
    y += 26
    center_x(d, "상세 운세", f_sec, PW, y, GOLD)
    y += 22
    rr(d, (bx0, y, bx1, y + 48), 14, GOLD, outline=None)
    center_x(d, "광고 보고 상세 운세 확인", load_font(13), PW, y + 14, BTN_TEXT)
    y += 56
    rr(d, (bx0, y, bx1, y + 46), 16, CARD, outline=GOLD, width=1)
    center_x(d, "번호 공유하기", load_font(14), PW, y + 14, GOLD)
    y += 54
    rr(d, (bx0, y, bx1, y + 46), 16, GOLD, outline=None)
    center_x(d, "다시 뽑기", load_font(14), PW, y + 14, BTN_TEXT)
    y += 58
    center_x(d, "오늘 하루도 행운이 함께하길 바랍니다", f_small, PW, y, HINT)

    im.save(out, "PNG", optimize=True)
    print(out)


def landscape_wide(out: Path, logo_path: Path | None) -> None:
    im = Image.new("RGB", (LW, LH), BG)
    d = ImageDraw.Draw(im)
    f_title = load_font(36)
    f_sub = load_font(18)
    f_dig = load_font(52)
    f_grp = load_font(22)
    f_line = load_font(16)

    # 좌: 로고 또는 플레이스홀더
    lx = 100
    if logo_path and logo_path.is_file():
        lg = Image.open(logo_path).convert("RGBA")
        lh_target = min(380, LH - 120)
        sc = lh_target / lg.size[1]
        nw, nh = int(lg.size[0] * sc), int(lg.size[1] * sc)
        lg = lg.resize((nw, nh), Image.Resampling.LANCZOS)
        ly = (LH - nh) // 2
        im_rgba = im.convert("RGBA")
        im_rgba.paste(lg, (lx, ly), lg)
        im = im_rgba.convert("RGB")
        d = ImageDraw.Draw(im)
    else:
        rr(d, (lx, (LH - 200) // 2, lx + 200, (LH + 200) // 2), 24, CARD, outline=BORDER, width=1)
        d.text((lx + 70, LH // 2 - 10), "♣", font=load_font(80), fill=GOLD)

    mid = LW // 2 - 40
    d.text((mid, LH // 2 - 120), "3조", font=f_grp, fill=GOLD, anchor="mm")
    d.text((mid, LH // 2 - 40), "1 2 8 4 0 7", font=f_dig, fill=MAIN, anchor="mm")
    d.text((mid, LH // 2 + 48), "연금복권 형식 행운번호", font=f_sub, fill=SUB, anchor="mm")

    rx = LW - 420
    d.text((rx, LH // 2 - 80), "목요일의 행운", font=f_title, fill=MAIN)
    d.text((rx, LH // 2 - 28), "AI 사주 · 재물 운세", font=f_sub, fill=SUB)
    d.text((rx, LH // 2 + 16), "생년월일만으로 오늘의 번호", font=f_line, fill=SUB)

    im.save(out, "PNG", optimize=True)
    print(out)


def main() -> int:
    root = Path(__file__).resolve().parents[1] / "public" / "branding" / "previews"
    root.mkdir(parents=True, exist_ok=True)
    logo = Path(
        "/Users/hyunsker/.cursor/projects/Users-hyunsker/assets/clover_dark_600-c885681e-e37d-4316-bfb7-247eb4b34a47.png"
    )
    if len(sys.argv) > 1:
        alt = Path(sys.argv[1])
        if alt.is_file():
            logo = alt

    portrait_input(root / "preview-portrait-01-input.png")
    portrait_loading(root / "preview-portrait-02-loading.png")
    portrait_result(root / "preview-portrait-03-result.png")
    landscape_wide(root / "preview-landscape-01.png", logo if logo.is_file() else None)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
