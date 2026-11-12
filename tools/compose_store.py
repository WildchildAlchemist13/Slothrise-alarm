import re, random, sys
S = sys.argv[1]; OUT = sys.argv[2]
APP = '/home/user/slothrise-app'; BRAND = '/home/user/slothrise-brand'
FONT = APP + '/node_modules/@expo-google-fonts/fredoka'
W, H, N = 1290, 2796, 5
random.seed(7)

# Snooze head only, cut from the logo (vector, stays sharp at any size).
logo = open(BRAND + '/slothrise-logo.svg').read()
mascot = re.search(r'<g id="mascot">.*?</g>', logo, re.S).group(0)
open(OUT + '/snooze-mark.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 402">{mascot}</svg>')

PLUM = '#3C0A2F'
def icon(kind, size=64, color=PLUM, sw=2.2):
    paths = {
        'calc': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
        'grid': '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
        'keys': '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
        'target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
        'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        'tilt': '<rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(-18 12 12)"/><path d="M3 8a10 10 0 0 0 0 8M21 8a10 10 0 0 1 0 8"/>',
        'push': '<path d="M5 12h12M13 7l5 5-5 5"/><path d="M3 5v14"/>',
        'tap': '<path d="M9 11V5a2 2 0 0 1 4 0v6M13 10a2 2 0 0 1 4 0v3c0 4-3 7-6 7s-5-2-6-5l-1-3a1.6 1.6 0 0 1 2.8-1.5L9 13"/><path d="M5 4l2 2M11 1v1M17 4l-2 2"/>',
        'check': '<path d="M5 12l5 5L20 7"/>',
        'flame': '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
    }[kind]
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>'

def phone(x, y, shot, top_color, width=1010):
    bez = 34; sw = width - 2 * bez; sh = round(sw * 2532 / 1170); inset = round(sw / 390 * 54)
    return f'''<div class="phone" style="left:{x}px;top:{y}px;width:{width}px;height:{sh + 2 * bez}px">
  <div class="screen" style="left:{bez}px;top:{bez}px;width:{sw}px;height:{sh}px;background:{top_color}">
    <img src="file://{S}/shots/{shot}.png" style="position:absolute;left:0;top:{inset}px;width:{sw}px;height:{sh}px">
    <div class="status"><span>6:20</span><span class="sb"><svg width="120" height="40" viewBox="0 0 60 20"><g fill="#FFF4E2"><rect x="0" y="12" width="4" height="6" rx="1"/><rect x="6" y="9" width="4" height="9" rx="1"/><rect x="12" y="6" width="4" height="12" rx="1"/><rect x="18" y="3" width="4" height="15" rx="1"/><rect x="30" y="4" width="24" height="12" rx="3.5" fill="none" stroke="#FFF4E2" stroke-width="1.6"/><rect x="32.5" y="6.5" width="16" height="7" rx="1.5"/><rect x="55.5" y="8" width="2" height="4" rx="1"/></g></svg></span></div>
    <div class="island"></div>
  </div></div>'''

def headline(i, text, top=210, size=150):
    return f'<h1 style="left:{i * W + 70}px;top:{top}px;width:{W - 140}px;font-size:{size}px">{text}</h1>'

def card(x, y, w, inner, pad=44):
    return f'<div class="card" style="left:{x}px;top:{y}px;width:{w}px;padding:{pad}px">{inner}</div>'

# ---------- sky panorama ----------
clouds = ''
for _ in range(46):
    cx = random.uniform(-200, W * N + 200); cy = random.uniform(80, H * 0.7)
    cw = random.uniform(360, 1100); ch = cw * random.uniform(0.22, 0.4); op = random.uniform(0.18, 0.5)
    clouds += f'<div class="cloud" style="left:{cx - cw / 2:.0f}px;top:{cy - ch / 2:.0f}px;width:{cw:.0f}px;height:{ch:.0f}px;opacity:{op:.2f}"></div>'

els = []
# Slide 1: hero
X = 0
els.append(f'<div class="wordmark" style="left:{X}px;top:150px;width:{W}px">Slothrise</div>')
els.append(headline(0, 'The alarm you<br>can’t sleep through', top=280, size=146))
by = 1240  # branch centre
art_w = 760; s = art_w / 395
els.append(f'<div class="branch" style="left:-40px;top:{by - 36 * s / 2:.0f}px;width:{W + 40}px;height:{36 * s:.0f}px;border-width:{9 * s:.0f}px 0"></div>')
els.append(f'<img src="file://{APP}/assets/snooze-hang.png" style="position:absolute;left:{W / 2 - art_w / 2:.0f}px;top:{by - 60 * s:.0f}px;width:{art_w}px">')
els.append(f'<div class="zzz" style="left:{W / 2 + 270}px;top:{by + 40}px">z<span style="font-size:1.3em">z</span><span style="font-size:1.7em">Z</span></div>')
els.append(f'''<div class="appchip" style="left:{X + 150}px;top:2330px;width:{W - 300}px">
  <img src="file://{BRAND}/slothrise-icon.svg" style="width:210px;height:210px">
  <div><div class="chipT">Alarm &amp; Habits</div><div class="chipS">Hello, wake up!!</div></div></div>''')

# Slide 2: ringing + mission card
X = W
els.append(headline(1, 'Get up to<br>switch it off'))
els.append(phone(X + 140, 720, 'ringing', '#6C3DF0'))
keypad = ''.join(f'<div class="key">{k}</div>' for k in '123456789') + '<div class="key">⌫</div><div class="key">0</div>' + f'<div class="key ok">{icon("check", 54, PLUM, 3)}</div>'
els.append(card(X + 700, 1500, 560, f'''
  <div class="row" style="gap:18px"><img src="file://{OUT}/snooze-mark.svg" style="width:96px"><div><div class="eyebrow">WAKE-UP MISSION</div><div class="ct" style="font-size:46px">Solve to stop me</div></div></div>
  <div class="chips">{''.join(f'<span>{icon(k, 40)}</span>' for k in ['calc','grid','keys','target'])}</div><div class="sum">7 × 13</div><div class="ans">91</div><div class="pad">{keypad}</div>'''))
icons = ''.join(f'<div class="ico">{icon(k, 74)}</div>' for k in ['calc', 'grid', 'keys', 'target'])

# Slide 3: meet Snooze, interactive
X = 2 * W
els.append(headline(2, 'Meet Snooze.<br>Lazier than you.'))
els.append(phone(X + 140, 720, 'welcome-tap', '#6C3DF0'))
rows = [('tilt', 'Tilt your phone', 'He swings on his branch'), ('push', 'Give him a push', 'Whoosh. Still asleep.'), ('tap', 'Tap him', '“Hello, wake up!!”')]
y0 = 1540
for k, (ic, t, sub) in enumerate(rows):
    els.append(card(X + 90 + k * 40, y0 + k * 270, 820, f'<div class="row" style="gap:30px"><div class="ring">{icon(ic, 64)}</div><div><div class="ct">{t}</div><div class="cs">{sub}</div></div></div>', pad=40))

# Slide 4: streak + routine
X = 3 * W
els.append(headline(3, 'A streak worth<br>waking up for'))
els.append(phone(X + 250, 720, 'win', '#452B8C'))
items = [('Big glass of water', True), ('Write 300 words', True), ('Make the bed', False), ('10 min stretch', False)]
lst = ''.join(f'<div class="hab {"done" if d else ""}"><div class="box">{icon("check", 40, PLUM, 3.2) if d else ""}</div><span>{t}</span></div>' for t, d in items)
els.append(card(X + 60, 2110, 700, f'<div class="row" style="justify-content:space-between"><div class="ct">Morning routine</div><div class="pill">2 / 5</div></div>{lst}'))

# Slide 5: gentle mode, no phone
X = 4 * W
els.append(headline(4, 'Gentle mode for<br>slow mornings'))
els.append(f'<div class="cloudbed" style="left:{X + 245}px;top:1300px"></div>')
els.append(f'<img src="file://{OUT}/snooze-mark.svg" style="position:absolute;left:{X + 285}px;top:760px;width:720px;filter:drop-shadow(0 30px 40px rgba(60,10,47,.25))">')
feats = [('sun', 'A 3-minute sunrise. The screen brightens and the sound rises slowly.'),
         ('target', 'Still in bed after 5 minutes? A backup mission takes over.')]
for k, (ic, t) in enumerate(feats):
    els.append(card(X + 90, 1700 + k * 420, W - 180, f'<div class="row" style="gap:36px"><div class="ring big">{icon(ic, 84)}</div><div class="ft">{t}</div></div>', pad=50))

html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Fredoka; font-weight: 500; src: url(file://{FONT}/500Medium/Fredoka_500Medium.ttf); }}
@font-face {{ font-family: Fredoka; font-weight: 600; src: url(file://{FONT}/600SemiBold/Fredoka_600SemiBold.ttf); }}
@font-face {{ font-family: Fredoka; font-weight: 700; src: url(file://{FONT}/700Bold/Fredoka_700Bold.ttf); }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ width: {W * N}px; height: {H}px; overflow: hidden; font-family: Fredoka, sans-serif; color: {PLUM}; }}
.pano {{ position: relative; width: {W * N}px; height: {H}px; overflow: hidden;
  background: linear-gradient(180deg, #3A26C4 0%, #5E3BE0 26%, #9A5BE0 46%, #E07FC0 64%, #FF9E7A 80%, #FFD27A 100%); }}
.sun {{ position: absolute; left: {W * 1.05 - 900}px; top: {H - 900}px; width: 1800px; height: 1800px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,236,170,.95) 0%, rgba(255,200,120,.55) 30%, rgba(255,160,120,0) 62%); }}
.sun2 {{ position: absolute; left: {W * 4.4 - 800}px; top: {H - 760}px; width: 1600px; height: 1600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,236,170,.85) 0%, rgba(255,190,120,.4) 32%, rgba(255,160,120,0) 62%); }}
.cloud {{ position: absolute; border-radius: 50%; background: #FFF6F0; filter: blur(46px); }}
h1 {{ position: absolute; color: #fff; text-align: center; font-weight: 700; line-height: 1.04; letter-spacing: -1px; text-shadow: 0 6px 30px rgba(40,10,90,.25); }}
.wordmark {{ position: absolute; text-align: center; color: #FFF4E2; font-size: 84px; font-weight: 600; opacity: .95; }}
.branch {{ position: absolute; background: #94502A; border-style: solid; border-color: #37062A; }}
.zzz {{ position: absolute; color: #FFF4E2; font-weight: 700; font-size: 54px; transform: rotate(-12deg); }}
.appchip {{ position: absolute; display: flex; align-items: center; gap: 44px; background: rgba(255,255,255,.92); border-radius: 64px; padding: 34px 50px; box-shadow: 0 30px 80px rgba(60,10,47,.25); }}
.chipT {{ font-size: 70px; font-weight: 700; }} .chipS {{ font-size: 50px; font-weight: 600; color: #FF6B3D; }}
.phone {{ position: absolute; background: #111; border-radius: 150px; box-shadow: 0 60px 120px rgba(40,10,90,.45), inset 0 0 0 6px #2a2a2a; }}
.screen {{ position: absolute; border-radius: 118px; overflow: hidden; }}
.island {{ position: absolute; left: 50%; top: 30px; width: 290px; height: 84px; margin-left: -145px; background: #000; border-radius: 42px; }}
.status {{ position: absolute; left: 0; right: 0; top: 46px; padding: 0 84px; display: flex; justify-content: space-between; color: #FFF4E2; font-size: 44px; font-weight: 600; }}
.card {{ position: absolute; background: #FFFDF9; border-radius: 56px; box-shadow: 0 40px 90px rgba(60,10,47,.28); }}
.row {{ display: flex; align-items: center; }}
.eyebrow {{ font-size: 30px; font-weight: 700; letter-spacing: 3px; color: #FF6B3D; }}
.ct {{ font-size: 54px; font-weight: 700; line-height: 1.1; }} .cs {{ font-size: 40px; font-weight: 500; color: #7A6487; margin-top: 4px; }}
.ft {{ font-size: 52px; font-weight: 600; line-height: 1.25; }}
.sum {{ font-size: 130px; font-weight: 700; text-align: center; margin-top: 18px; }}
.ans {{ height: 120px; border-radius: 34px; border: 6px solid #FFB50C; display: grid; place-items: center; font-size: 76px; font-weight: 700; background: #FFF4D6; }}
.pad {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 22px; }}
.key {{ height: 96px; border-radius: 28px; background: #F2E9F5; display: grid; place-items: center; font-size: 52px; font-weight: 700; }}
.key.ok {{ background: #3EE6B0; }}
.chips {{ display: flex; gap: 14px; margin-top: 22px; }} .chips span {{ width: 76px; height: 76px; border-radius: 22px; background: #F2E9F5; display: grid; place-items: center; }}
.icorow {{ position: absolute; display: flex; gap: 22px; }}
.ico {{ width: 124px; height: 124px; border-radius: 36px; background: #FFFDF9; display: grid; place-items: center; box-shadow: 0 24px 50px rgba(60,10,47,.25); }}
.minilabel {{ position: absolute; color: #fff; font-size: 44px; font-weight: 600; text-shadow: 0 4px 20px rgba(40,10,90,.35); }}
.ring {{ width: 120px; height: 120px; border-radius: 50%; border: 5px solid #E9DDF0; display: grid; place-items: center; flex: none; background: #fff; }}
.ring.big {{ width: 150px; height: 150px; background: #FFF4D6; border-color: #FFE0A0; }}
.pill {{ background: #3EE6B0; border-radius: 999px; padding: 10px 30px; font-size: 44px; font-weight: 700; }}
.hab {{ display: flex; align-items: center; gap: 26px; margin-top: 26px; font-size: 46px; font-weight: 600; }}
.box {{ width: 76px; height: 76px; border-radius: 22px; border: 5px solid #E2D4EA; display: grid; place-items: center; flex: none; }}
.hab.done .box {{ background: #3EE6B0; border-color: #3EE6B0; }} .hab.done span {{ color: #9A86A6; text-decoration: line-through; }}
.cloudbed {{ position: absolute; width: 800px; height: 260px; border-radius: 50%; background: #FFF6F0; filter: blur(30px); opacity: .9; }}
</style></head><body><div class="pano"><div class="sun"></div><div class="sun2"></div>{clouds}{"".join(els)}</div></body></html>'''
open(S + '/store.html', 'w').write(html)
print('ok', len(html))
