# Bigger monitor + tighter crops for the long version; music-only soundtrack.
s = open('build_long.py', encoding='utf-8').read()
rep = [
 ('<div id="caps" class="abs" style="left:120px;top:300px;width:500px"></div>',
  '<div id="caps" class="abs" style="left:80px;top:300px;width:380px"></div>'),
 ('<div id="mon" class="abs" style="left:650px;top:110px;width:1180px;height:900px">',
  '<div id="mon" class="abs" style="left:500px;top:40px;width:1372px;height:960px">'),
 ('width:1180px;height:751px;background:#0b0f19;border-radius:26px;padding:18px;',
  'width:1372px;height:870px;background:#0b0f19;border-radius:26px;padding:16px;'),
 ('<div id="screen" style="position:relative;width:1144px;height:715px;',
  '<div id="screen" style="position:relative;width:1340px;height:838px;'),
 ('left:530px;top:751px;width:120px;height:86px;', 'left:631px;top:870px;width:110px;height:66px;'),
 ('left:400px;top:832px;width:380px;height:22px;', 'left:496px;top:932px;width:380px;height:20px;'),
 ('id="toast" class="abs" style="left:1180px;top:60px;', 'id="toast" class="abs" style="left:1200px;top:16px;'),
 ('.cap{position:absolute;left:0;top:0;width:500px;opacity:0}', '.cap{position:absolute;left:0;top:0;width:380px;opacity:0}'),
 ('.cap p{font-size:34px;', '.cap p{font-size:30px;'),
 ('.layer{position:absolute;left:0;top:0;width:1144px;height:715px;', '.layer{position:absolute;left:0;top:0;width:1340px;height:838px;'),
 ('.layer img{width:1144px;height:715px;display:block}', '.layer img{width:1340px;height:838px;display:block}'),
 ("h=>h.scrollWidth<=500", "h=>h.scrollWidth<=380"),
 ("const BTN=[0.1715*1144, 0.2744*715];", "const SW=1340, SH=838;\nconst BTN=[0.1715*SW, 0.2744*SH];"),
 ("translate(${-x*1144/f}px,${-y*715/f}px)", "translate(${-x*SW/f}px,${-y*SH/f}px)"),
 ("x=mix(760,BTN[0]-4,k), y=mix(520,BTN[1]-4,k)", "x=mix(900,BTN[0]-4,k), y=mix(600,BTN[1]-4,k)"),
 # tighter crops
 ("crop:[0.14,0,0.70]", "crop:[0.14,0,0.60]"),
 ("crop:[0.177,0,0.78]", "crop:[0.237,0.155,0.66]"),
 ("crop:[0.285,0,0.56]", "crop:[0.315,0.03,0.50]"),
 ("crop:[0.25,0.39,0.50]", "crop:[0.28,0.42,0.44]"),
 ("crop:[0.205,0,0.72]", "crop:[0.235,0.02,0.66]"),
 ("crop:[0.315,0,0.50]", "crop:[0.335,0,0.46]"),
 ("crop:[0.29,0,0.55]", "crop:[0.315,0,0.50]"),
 ("crop:[0.255,0,0.62]", "crop:[0.27,0.03,0.60]"),
]
for a, b in rep:
    assert a in s, a
    s = s.replace(a, b)
open('build_long.py', 'w', encoding='utf-8').write(s)

a = open('audio-long.py', encoding='utf-8').read()
assert 'mix = music + sfx' in a
a = a.replace('mix = music + sfx', 'mix = music  # music only, no sound effects')
open('audio-long.py', 'w', encoding='utf-8').write(a)
print('patched')
