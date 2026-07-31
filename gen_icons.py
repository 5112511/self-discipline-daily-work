from PIL import Image, ImageDraw, ImageFont
import os

out_dir = os.path.join(os.path.dirname(__file__), 'public')
os.makedirs(out_dir, exist_ok=True)

# 底色 + 圆角，画 "玥" 字图标
def make_icon(size: int, maskable: bool = False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 背景：圆角矩形，全黑
    if maskable:
        # 可屏蔽图标：满铺背景
        d.rectangle([0, 0, size, size], fill=(26, 26, 26, 255))
    else:
        r = int(size * 0.22)
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(26, 26, 26, 255))
    # "玥" 字
    font_size = int(size * 0.5)
    font = None
    for f in ['C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/msyhbd.ttc', 'C:/Windows/Fonts/simhei.ttf']:
        if os.path.exists(f):
            try:
                font = ImageFont.truetype(f, font_size)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()
    text = '玥'
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - int(size * 0.03)
    d.text((x, y), text, font=font, fill=(251, 251, 250, 255))
    # 底部小点
    d.ellipse([size//2 - size//40, int(size*0.74), size//2 + size//40, int(size*0.74)+size//20], fill=(154, 154, 154, 255))
    return img

# 生成各尺寸
for s in [192, 256, 384, 512]:
    make_icon(s).save(os.path.join(out_dir, f'icon-{s}.png'))
make_icon(180).save(os.path.join(out_dir, 'apple-touch-icon.png'))  # iPhone 主屏图标
make_icon(512, maskable=True).save(os.path.join(out_dir, 'icon-maskable-512.png'))
# favicon
make_icon(32).save(os.path.join(out_dir, 'favicon-32.png'))
print('icons generated:', os.listdir(out_dir))
