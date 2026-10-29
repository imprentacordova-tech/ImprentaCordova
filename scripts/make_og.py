"""
Genera la imagen Open Graph (1200x630) de Imprenta Córdova.

Se guarda en `public/og-image.png` y es la que usan index.html / WhatsApp / redes
para la vista previa. Sin ella, el enlace compartido aparece sin imagen.

Uso:
    python scripts/make_og.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "public", "LOGO.png")
OUT = os.path.join(ROOT, "public", "og-image.png")

W, H = 1200, 630
NAVY_TOP = (10, 17, 64)      # #0A1140
NAVY_BOT = (22, 48, 155)     # #16309B
GOLD = (255, 198, 26)        # #FFC61A
WHITE = (255, 255, 255)
SOFT = (194, 202, 230)       # #C2CAE6

img = Image.new("RGB", (W, H), NAVY_TOP)
draw = ImageDraw.Draw(img)

# Fondo: gradiente vertical navy
for y in range(H):
    t = y / H
    r = int(NAVY_TOP[0] + (NAVY_BOT[0] - NAVY_TOP[0]) * t)
    g = int(NAVY_TOP[1] + (NAVY_BOT[1] - NAVY_TOP[1]) * t)
    b = int(NAVY_TOP[2] + (NAVY_BOT[2] - NAVY_TOP[2]) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Círculos decorativos suaves (marca de agua)
draw.ellipse([860, -140, 1280, 280], outline=(255, 255, 255, 20), width=2)
draw.ellipse([980, 120, 1240, 380], outline=(255, 198, 26, 40), width=2)

# Barra dorada inferior
draw.rectangle([0, H - 12, W, H], fill=GOLD)

# Logo
if os.path.exists(LOGO):
    logo = Image.open(LOGO).convert("RGBA")
    side = 168
    logo = logo.resize((side, side), Image.LANCZOS)
    img.paste(logo, (88, 78), logo)


def load_font(candidates, size):
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


BOLD = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
REG = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]

f_badge = load_font(BOLD, 22)
f_title = load_font(BOLD, 66)
f_sub = load_font(REG, 32)
f_url = load_font(BOLD, 30)

# Píldora "AUTORIZADA SRI"
badge = "IMPRENTA AUTORIZADA SRI  ·  CÓD. 8634"
bb = draw.textbbox((0, 0), badge, font=f_badge)
bw, bh = bb[2] - bb[0], bb[3] - bb[1]
px, py = 90, 300
draw.rounded_rectangle([px, py, px + bw + 40, py + bh + 22], radius=10,
                       fill=(8, 13, 50), outline=GOLD, width=1)
draw.text((px + 20, py + 10), badge, font=f_badge, fill=GOLD)

# Título
draw.text((88, 362), "IMPRENTA CÓRDOVA", font=f_title, fill=WHITE)

# Subtítulo
draw.text((90, 452), "Impresión · SRI Autorizado · Diseño", font=f_sub, fill=SOFT)

# URL
draw.text((90, 508), "imprentacordova.net", font=f_url, fill=GOLD)

img.save(OUT, "PNG", optimize=True)
print("OK:", OUT, img.size)
