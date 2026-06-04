from PIL import Image, ImageDraw, ImageFont, ImageFilter


OUT = "assets/daoshu-preview-cover.png"
W, H = 1200, 760
S = 3
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_ALT = "/System/Library/Fonts/STHeiti Medium.ttc"


def sc(v):
    return int(round(v * S))


def font(size):
    return ImageFont.truetype(FONT, sc(size))


def font_alt(size):
    return ImageFont.truetype(FONT_ALT, sc(size))


def text_center(draw, xy, text, fnt, fill, **kwargs):
    x, y = xy
    box = draw.textbbox((0, 0), text, font=fnt)
    tw = box[2] - box[0]
    th = box[3] - box[1]
    draw.text((sc(x) - tw // 2, sc(y) - th // 2), text, font=fnt, fill=fill, **kwargs)


def draw_vertical(draw, x, y, text, fnt, fill, gap=4):
    yy = y
    for ch in text:
        box = draw.textbbox((0, 0), ch, font=fnt)
        tw = box[2] - box[0]
        th = box[3] - box[1]
        draw.text((sc(x) - tw // 2, sc(yy)), ch, font=fnt, fill=fill)
        yy += th / S + gap


def gradient_rect(size, left, right):
    img = Image.new("RGB", size, left)
    px = img.load()
    for x in range(size[0]):
        t = x / max(1, size[0] - 1)
        col = tuple(int(left[i] * (1 - t) + right[i] * t) for i in range(3))
        for y in range(size[1]):
            px[x, y] = col
    return img


def radial_badge(size):
    img = Image.new("RGBA", (sc(size), sc(size)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((sc(1), sc(1), sc(size - 1), sc(size - 1)), fill=(255, 246, 209, 255), outline=(229, 183, 70, 255), width=sc(5))
    d.ellipse((sc(14), sc(14), sc(size - 14), sc(size - 14)), fill=(255, 251, 232, 255), outline=(244, 210, 123, 255), width=sc(3))
    return img


def main():
    base = Image.new("RGB", (sc(W), sc(H)), (244, 250, 247))
    draw = ImageDraw.Draw(base)

    # Card shadow and paper.
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((sc(26), sc(24), sc(1174), sc(736)), radius=sc(34), fill=(16, 60, 117, 30))
    shadow = shadow.filter(ImageFilter.GaussianBlur(sc(16)))
    base = Image.alpha_composite(base.convert("RGBA"), shadow)
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle((sc(26), sc(24), sc(1174), sc(736)), radius=sc(34), fill=(255, 255, 255), outline=(220, 232, 243), width=sc(2))

    # Soft cover face background.
    face = gradient_rect((sc(1148), sc(712)), (255, 255, 255), (234, 244, 255)).convert("RGBA")
    mask = Image.new("L", face.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, face.size[0] - 1, face.size[1] - 1), radius=sc(34), fill=255)
    base.paste(face, (sc(26), sc(24)), mask)
    draw = ImageDraw.Draw(base)

    # Book spine.
    spine = gradient_rect((sc(184), sc(712)), (3, 22, 63), (2, 18, 54)).convert("RGBA")
    overlay = Image.new("RGBA", spine.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, sc(70), spine.size[1]), fill=(9, 62, 150, 170))
    od.rectangle((sc(145), 0, spine.size[0], spine.size[1]), fill=(0, 0, 0, 82))
    spine = Image.alpha_composite(spine, overlay)
    spine_mask = Image.new("L", spine.size, 0)
    smd = ImageDraw.Draw(spine_mask)
    smd.rounded_rectangle((0, 0, spine.size[0], spine.size[1]), radius=sc(28), fill=255)
    base.paste(spine, (sc(28), sc(24)), spine_mask)
    draw = ImageDraw.Draw(base)
    draw.line((sc(50), sc(44), sc(50), sc(716)), fill=(255, 255, 255, 85), width=sc(2))
    draw.rectangle((sc(198), sc(24), sc(214), sc(736)), fill=(4, 16, 48, 54))
    draw.rectangle((sc(214), sc(24), sc(230), sc(736)), fill=(0, 0, 0, 20))

    # Spine text.
    text_center(draw, (116, 88), "第", font_alt(27), (246, 216, 135))
    draw.text((sc(101), sc(100)), "7", font=ImageFont.truetype(FONT_ALT, sc(48)), fill=(255, 209, 102))
    text_center(draw, (116, 164), "届", font_alt(27), (246, 216, 135))
    draw.line((sc(64), sc(206), sc(166), sc(206)), fill=(255, 255, 255, 92), width=sc(2))
    draw_vertical(draw, 116, 240, "高三靶向刷题集训营", font_alt(42), (255, 255, 255), gap=0)
    draw.line((sc(64), sc(680), sc(166), sc(680)), fill=(255, 255, 255, 92), width=sc(2))
    text_center(draw, (116, 708), "多分集训", font_alt(24), (246, 216, 135))

    # Page edge.
    draw.rounded_rectangle((sc(1110), sc(56), sc(1132), sc(706)), radius=sc(12), fill=(214, 229, 248))
    for y in range(72, 690, 16):
        draw.line((sc(1119), sc(y), sc(1119), sc(y + 8)), fill=(184, 204, 232), width=sc(2))

    # Top brand and edition pill.
    draw.text((sc(270), sc(74)), "洛优高考", font=font_alt(52), fill=(17, 24, 39))
    draw.text((sc(272), sc(132)), "LUO YOU GAOKAO", font=ImageFont.truetype(FONT_ALT, sc(27)), fill=(55, 65, 81), spacing=sc(2))
    pill = gradient_rect((sc(330), sc(60)), (6, 44, 134), (215, 25, 32)).convert("RGBA")
    pill_mask = Image.new("L", pill.size, 0)
    pmd = ImageDraw.Draw(pill_mask)
    pmd.rounded_rectangle((0, 0, pill.size[0], pill.size[1]), radius=sc(30), fill=255)
    base.paste(pill, (sc(740), sc(82)), pill_mask)
    draw = ImageDraw.Draw(base)
    text_center(draw, (905, 112), "2027届专版 · 第一册", font_alt(27), (255, 255, 255))

    draw.rounded_rectangle((sc(270), sc(208), sc(490), sc(256)), radius=sc(24), fill=(234, 242, 255))
    text_center(draw, (380, 232), "高三数学资料", font_alt(25), (11, 75, 181))

    draw.text((sc(270), sc(284)), "高三导数", font=font_alt(82), fill=(17, 24, 39))
    draw.text((sc(270), sc(372)), "精讲手本", font=font_alt(96), fill=(7, 31, 98))

    # Badge.
    badge = radial_badge(184)
    base.alpha_composite(badge, (sc(838), sc(206)))
    draw = ImageDraw.Draw(base)
    draw.text((sc(884), sc(226)), "50", font=ImageFont.truetype(FONT_ALT, sc(76)), fill=(17, 24, 39))
    draw.text((sc(974), sc(270)), "道", font=font_alt(32), fill=(8, 47, 145))
    draw.rounded_rectangle((sc(844), sc(334), sc(1016), sc(382)), radius=sc(13), fill=(215, 25, 32))
    text_center(draw, (930, 358), "精选好题", font_alt(29), (255, 255, 255))

    # Swoosh.
    swoosh = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sw = ImageDraw.Draw(swoosh)
    sw.line((sc(640), sc(610), sc(805), sc(575), sc(980), sc(520), sc(1110), sc(474)), fill=(46, 114, 210, 52), width=sc(34))
    sw.line((sc(695), sc(654), sc(835), sc(612), sc(1000), sc(545), sc(1140), sc(448)), fill=(15, 85, 194, 72), width=sc(18))
    sw.polygon([(sc(900), sc(520)), (sc(1126), sc(430)), (sc(1043), sc(633))], fill=(30, 98, 199, 42))
    base = Image.alpha_composite(base, swoosh)
    draw = ImageDraw.Draw(base)

    # Source pill.
    draw.rounded_rectangle((sc(270), sc(508), sc(700), sc(562)), radius=sc(27), fill=(255, 255, 255), outline=(204, 218, 234), width=sc(2))
    draw.ellipse((sc(285), sc(518), sc(319), sc(552)), fill=(255, 255, 255), outline=(215, 25, 32), width=sc(8))
    draw.text((sc(332), sc(523)), "源自往届集训营真实题库", font=font_alt(25), fill=(8, 47, 145))

    # Bottom tags.
    for x, label in [(272, "精选好题"), (512, "方法拆解"), (752, "往届答题卡")]:
        draw.rounded_rectangle((sc(x), sc(632), sc(x + 216), sc(698)), radius=sc(18), fill=(255, 255, 255), outline=(220, 232, 248), width=sc(2))
        text_center(draw, (x + 108, 665), label, font_alt(29), (11, 59, 149))

    base = base.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    base.save(OUT, "PNG", optimize=True)


if __name__ == "__main__":
    main()
