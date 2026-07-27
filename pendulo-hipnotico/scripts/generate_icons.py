"""
Genera los iconos PNG de la PWA (192, 512, maskable-512, apple-touch-icon)
a partir de una descripción vectorial simple, sin dependencias externas
más allá de Pillow. Se ejecuta una sola vez para poblar /public/icons.

Uso:
    python3 scripts/generate_icons.py
"""

import math
import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (7, 7, 11, 255)
GOLD_CORE = (255, 243, 214)
GOLD_MID = (217, 163, 74)
GOLD_EDGE = (122, 78, 20)
MOUNT = (85, 85, 95, 255)
STRING = (154, 154, 164, 255)


def radial_gradient_circle(size, cx, cy, r, core, mid, edge):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = layer.load()
    r2 = r * r
    for y in range(max(0, cy - r - 1), min(size, cy + r + 1)):
        for x in range(max(0, cx - r - 1), min(size, cx + r + 1)):
            dx, dy = x - cx, y - cy
            d2 = dx * dx + dy * dy
            if d2 > r2:
                continue
            t = math.sqrt(d2) / r
            if t < 0.55:
                tt = t / 0.55
                col = tuple(int(core[i] + (mid[i] - core[i]) * tt) for i in range(3))
            else:
                tt = (t - 0.55) / 0.45
                col = tuple(int(mid[i] + (edge[i] - mid[i]) * tt) for i in range(3))
            px[x, y] = (*col, 255)
    return layer


def build_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # radio de "zona segura" para iconos maskable (círculo central ~80%)
    safe = size * 0.8 if maskable else size

    cx = size // 2
    origin_y = int(size * 0.24 if not maskable else size * 0.30)

    mount_half = int(safe * 0.26)
    draw.rounded_rectangle(
        [cx - mount_half, origin_y - int(size * 0.02), cx + mount_half, origin_y + int(size * 0.02)],
        radius=int(size * 0.02),
        fill=MOUNT,
    )

    bob_r = int(safe * 0.22)
    bob_cx = cx + int(safe * 0.06)
    bob_cy = int(size * (0.62 if not maskable else 0.66))

    draw.line([(cx, origin_y), (bob_cx, bob_cy)], fill=STRING, width=max(2, size // 128))

    bob_layer = radial_gradient_circle(size, bob_cx, bob_cy, bob_r, GOLD_CORE, GOLD_MID, GOLD_EDGE)
    img = Image.alpha_composite(img, bob_layer)

    return img


for size, maskable, name in [
    (192, False, "icon-192.png"),
    (512, False, "icon-512.png"),
    (512, True, "icon-maskable-512.png"),
    (180, False, "apple-touch-icon.png"),
]:
    icon = build_icon(size, maskable=maskable)
    icon.convert("RGBA").save(os.path.join(OUT_DIR, name))
    print(f"generado {name}")
