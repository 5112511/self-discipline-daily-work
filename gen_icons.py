from PIL import Image, ImageDraw
import os

out_dir = os.path.join(os.path.dirname(__file__), 'public')
os.makedirs(out_dir, exist_ok=True)

# 原创手绘黄小人图标，避免使用任何已有角色或标识。
def make_icon(size: int, maskable: bool = False):
    img = Image.new('RGBA', (size, size), (250, 246, 235, 255))
    d = ImageDraw.Draw(img)
    s = size / 512
    sc = lambda n: int(n * s)
    ink = '#3d4654'

    if not maskable:
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=sc(112), fill=255)
        base = Image.new('RGBA', (size, size), (250, 246, 235, 0))
        base.paste(img, mask=mask)
        img = base
        d = ImageDraw.Draw(img)

    # 微妙的手绘光晕
    d.ellipse((sc(84), sc(102), sc(429), sc(437)), fill='#f6e9c2')
    # 小黄人身体及不规则轮廓
    d.rounded_rectangle((sc(157), sc(104), sc(356), sc(382)), radius=sc(92), fill='#ffd84d', outline=ink, width=sc(8))
    # 背带裤
    d.rounded_rectangle((sc(157), sc(294), sc(356), sc(395)), radius=sc(28), fill='#6aa8c7', outline=ink, width=sc(8))
    d.line((sc(184), sc(286), sc(211), sc(332)), fill=ink, width=sc(10))
    d.line((sc(329), sc(286), sc(302), sc(332)), fill=ink, width=sc(10))
    d.ellipse((sc(202), sc(324), sc(215), sc(337)), fill='#f8f2dd', outline=ink, width=sc(3))
    d.ellipse((sc(296), sc(324), sc(309), sc(337)), fill='#f8f2dd', outline=ink, width=sc(3))
    # 手
    d.ellipse((sc(129), sc(307), sc(173), sc(354)), fill='#ffd84d', outline=ink, width=sc(7))
    d.ellipse((sc(340), sc(307), sc(384), sc(354)), fill='#ffd84d', outline=ink, width=sc(7))
    # 两只眼睛和眼镜
    d.ellipse((sc(176), sc(169), sc(260), sc(250)), fill='#e9edf0', outline=ink, width=sc(9))
    d.ellipse((sc(252), sc(169), sc(336), sc(250)), fill='#e9edf0', outline=ink, width=sc(9))
    d.line((sc(260), sc(208), sc(252), sc(208)), fill=ink, width=sc(7))
    d.ellipse((sc(207), sc(198), sc(227), sc(221)), fill=ink)
    d.ellipse((sc(282), sc(198), sc(302), sc(221)), fill=ink)
    # 微笑与腮红
    d.arc((sc(220), sc(226), sc(292), sc(279)), 15, 164, fill=ink, width=sc(7))
    d.ellipse((sc(173), sc(258), sc(198), sc(271)), fill='#f6aa89')
    d.ellipse((sc(315), sc(258), sc(340), sc(271)), fill='#f6aa89')
    # 两根俏皮头发和脚
    d.line((sc(230), sc(107), sc(219), sc(80), sc(203), sc(70)), fill=ink, width=sc(7))
    d.line((sc(272), sc(107), sc(284), sc(80), sc(302), sc(72)), fill=ink, width=sc(7))
    d.rounded_rectangle((sc(181), sc(380), sc(245), sc(405)), radius=sc(12), fill=ink)
    d.rounded_rectangle((sc(268), sc(380), sc(332), sc(405)), radius=sc(12), fill=ink)
    return img

for s in [192, 256, 384, 512]:
    make_icon(s).save(os.path.join(out_dir, f'icon-{s}.png'))
make_icon(180).save(os.path.join(out_dir, 'apple-touch-icon.png'))
make_icon(512, maskable=True).save(os.path.join(out_dir, 'icon-maskable-512.png'))
make_icon(32).save(os.path.join(out_dir, 'favicon-32.png'))
print('icons generated:', os.listdir(out_dir))
