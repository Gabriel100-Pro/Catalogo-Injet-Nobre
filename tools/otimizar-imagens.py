"""Gera as imagens otimizadas dos produtos em assets/produtos/.

Uso:  python tools/otimizar-imagens.py

Para cada PNG com fundo transparente em assets/ (nomes em kebab-case):
  1. recorta o espaço vazio em volta do produto;
  2. centraliza num quadro quadrado, com o lado maior do produto ocupando
     88% do quadro (assim todos ficam com o mesmo tamanho visual);
  3. salva <nome>-600.webp, <nome>-1000.webp e <nome>.png (fallback, 1000 px).
"""
import glob
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets")
OUT = os.path.join(SRC, "produtos")
CANVAS = 1000
FILL = 0.88
PREFIXES = ("estojo-", "suporte-")

os.makedirs(OUT, exist_ok=True)

for path in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    name = os.path.splitext(os.path.basename(path))[0]
    if not name.startswith(PREFIXES):
        continue
    im = Image.open(path).convert("RGBA")
    # ignora pixels quase transparentes (sujeira do recorte) ao calcular o recorte
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bbox)
    scale = (CANVAS * FILL) / max(im.size)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((CANVAS - im.width) // 2, (CANVAS - im.height) // 2))

    canvas.save(os.path.join(OUT, f"{name}-1000.webp"), "WEBP", quality=82, method=6)
    canvas.resize((600, 600), Image.LANCZOS).save(os.path.join(OUT, f"{name}-600.webp"), "WEBP", quality=80, method=6)
    # PNG de fallback com paleta de 256 cores (bem menor; o alfa é preservado)
    canvas.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(
        os.path.join(OUT, f"{name}.png"), optimize=True)
    print("ok", name)
