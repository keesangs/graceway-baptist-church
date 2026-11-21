from PIL import Image, ImageDraw
from pathlib import Path
import os

OUT = Path(os.environ.get('GRACEWAY_ARTIFACT_OUTPUT', str(Path.home() / 'graceway-artifacts' / 'newsletter-brand-icons')))
OUT.mkdir(parents=True, exist_ok=True)
S = 88
RING = '#8C929A'
WHITE = '#FFFFFF'


def canvas():
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((2, 2, S-3, S-3), outline=RING, width=2)
    return im, d

# Facebook: blue disc and white f mark.
im, d = canvas()
d.ellipse((22, 22, 66, 66), fill='#1877F2')
d.line([(47, 63), (47, 35), (48, 29), (52, 25), (58, 24), (64, 24)], fill=WHITE, width=6, joint='curve')
d.line([(38, 42), (61, 42)], fill=WHITE, width=5)
im.save(OUT / 'facebook-genuine.png', optimize=True)

# YouTube: red rounded rectangle and white play mark.
im, d = canvas()
d.rounded_rectangle((19, 27, 69, 61), radius=10, fill='#FF0000')
d.polygon([(39, 34), (39, 54), (57, 44)], fill=WHITE)
im.save(OUT / 'youtube-genuine.png', optimize=True)

# Instagram: gradient square with the official camera glyph.
im, d = canvas()
box = (21, 21, 67, 67)
mask = Image.new('L', (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle(box, radius=12, fill=255)
grad = Image.new('RGBA', (S, S), (0, 0, 0, 0))
pix = grad.load()
for y in range(S):
    for x in range(S):
        t = max(0, min(1, (x + (S - y)) / (2 * S)))
        # orange/pink/purple Instagram-style diagonal gradient
        r = int(255 * (1-t) + 115 * t)
        g = int(116 * (1-t) + 52 * t)
        b = int(38 * (1-t) + 201 * t)
        pix[x, y] = (r, g, b, 255)
im = Image.composite(grad, im, mask)
d = ImageDraw.Draw(im)
d.rounded_rectangle((31, 31, 57, 57), radius=8, outline=WHITE, width=4)
d.ellipse((37, 37, 51, 51), outline=WHITE, width=4)
d.ellipse((50, 34, 54, 38), fill=WHITE)
im.save(OUT / 'instagram-genuine.png', optimize=True)

print(*[str(p) for p in OUT.glob('*.png')], sep='\n')
