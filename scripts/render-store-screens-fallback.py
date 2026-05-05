#!/usr/bin/env python3
"""
캡처 스크립트(puppeteer)를 돌릴 수 없는 환경용 폴백.
앱 콘솔 미리보기용 "대략 톤"만 맞춘 390×844 PNG 3장.
정확한 UI는: npm run build && npm run preview 후 scripts/capture-store-screens.mjs
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "docs" / "preview-screenshots"
W, H = 390, 844
BG = "#0f0f0f"
CARD = "#1a1a1a"
GOLD = "#c9a84c"
MAIN = "#f0ead6"
SUB = "#8a8a8a"
BORDER = "#2a2a2a"


def font(size: int):
    for name in (
        "AppleSDGothicNeo-Medium",
        "AppleGothic",
        "Arial Unicode MS",
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def round_rect(d: ImageDraw.ImageDraw, box, r: int, fill):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=fill)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    f_title = font(24)
    f_sub = font(13)
    f_num = font(40)
    f_body = font(15)
    f_small = font(12)

    # 01 input
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    round_rect(d, (24, 100, W - 24, 260), 16, CARD)
    d.text((W // 2, 56), "목요일의 행운", font=f_title, fill=MAIN, anchor="mm")
    d.text(
        (W // 2, 88),
        "사주로 보는 나만의 연금복권 행운번호",
        font=f_sub,
        fill=SUB,
        anchor="mm",
    )
    d.text((40, 130), "생년월일", font=f_small, fill=SUB, anchor="lm")
    d.text((40, 180), "태어난 시간", font=f_small, fill=SUB, anchor="lm")
    round_rect(d, (32, 280, W - 32, 340), 16, GOLD)
    d.text((W // 2, 310), "행운번호 뽑기", font=f_sub, fill="#0f0f0f", anchor="mm")
    im.save(OUT / "01-input.png", "PNG")

    # 02 loading
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    cx, cy = W // 2, H // 2 - 40
    r = 70
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=2)
    d.text((W // 2, cy + 100), "68%", font=f_num, fill=GOLD, anchor="mm")
    t = "당신의 행운을 가져다줄\n네잎클로버를 완성 중입니다!"
    d.text((W // 2, H // 2 + 120), t, font=f_sub, fill=GOLD, anchor="mm", align="center")
    d.text(
        (W // 2, H - 100),
        "데이터 기반으로 분석하는 중입니다.",
        font=f_sub,
        fill=SUB,
        anchor="mm",
    )
    im.save(OUT / "02-loading.png", "PNG")

    # 03 result
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 48), "2026년 4월 6일 월요일", font=f_small, fill=SUB, anchor="mm")
    d.text((W // 2, 88), "오늘의 행운번호", font=f_title, fill=MAIN, anchor="mm")
    d.rounded_rectangle(
        [20, 120, W - 20, 320], radius=16, fill=CARD, outline=BORDER, width=1
    )
    d.text((W // 2, 160), "3조", font=f_sub, fill=GOLD, anchor="mm")
    d.text((W // 2, 220), "128457", font=f_num, fill=MAIN, anchor="mm")
    d.text((W // 2, 360), "오늘의 운세", font=f_sub, fill=GOLD, anchor="mm")
    para = "오늘은 가벼운 제안이나 소식이 들려오기\n쉬운 날이에요."
    d.text((W // 2, 400), para, font=f_body, fill=SUB, anchor="ma", align="center")
    round_rect(d, (20, 500, W - 20, 560), 16, GOLD)
    d.text((W // 2, 530), "다른 번호 보기", font=f_sub, fill="#0f0f0f", anchor="mm")
    gline = (201, 168, 76)
    d.rounded_rectangle([20, 580, W - 20, 640], radius=16, fill=CARD, outline=gline, width=1)
    d.text((W // 2, 610), "번호 공유하기", font=f_sub, fill=GOLD, anchor="mm")
    im.save(OUT / "03-result.png", "PNG")

    print("Wrote 01-input.png, 02-loading.png, 03-result.png →", OUT)


if __name__ == "__main__":
    main()
