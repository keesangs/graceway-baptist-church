from PIL import Image, ImageDraw
from pathlib import Path
import os

OUT = Path(os.environ.get('GRACEWAY_ARTIFACT_OUTPUT', str(Path.home() / 'graceway-artifacts' / 'newsletter-icons-legacy')))
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 88
NAVY = '#17324D'
SLATE = '#607A91'


def base():
    im = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((2, 2, SIZE-3, SIZE-3), outline=NAVY, width=2)
    return im, d

# Facebook: same simple outline treatment as the homepage Lucide icon.
im, d = base()
d.line([(49, 67), (49, 38), (50, 31), (54, 25), (60, 22), (67, 22)], fill=SLATE, width=6, joint='curve')
d.line([(39, 39), (67, 39)], fill=SLATE, width=6)
d.line([(49, 39), (49, 67)], fill=SLATE, width=6)
im.save(OUT / 'facebook-outline.png', optimize=True)

# Instagram.
im, d = base()
d.rounded_rectangle((22, 22, 66, 66), radius=12, outline=SLATE, width=5)
d.ellipse((33, 33, 55, 55), outline=SLATE, width=5)
d.ellipse((54, 28, 60, 34), fill=SLATE)
im.save(OUT / 'instagram-outline.png', optimize=True)

# YouTube.
im, d = base()
d.rounded_rectangle((18, 28, 70, 60), radius=9, outline=SLATE, width=5)
d.polygon([(38, 35), (38, 53), (57, 44)], outline=SLATE, fill=None)
d.line([(39, 36), (39, 52), (56, 44), (39, 36)], fill=SLATE, width=4, joint='curve')
im.save(OUT / 'youtube-outline.png', optimize=True)

print(*[str(p) for p in OUT.glob('*.png')], sep='\n')
