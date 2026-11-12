import re, sys, math
B = sys.argv[1]
# ---- logo on dark: cream wordmark + cream sticker edge behind the mascot
logo = open(f'{B}/slothrise-logo.svg').read()
m = re.search(r'(<g id="mascot">\s*)(<path fill="#3c0a2f"[^>]*?d="([^"]+)"/>)', logo)
sticker = f'<path fill="#FFF4E2" stroke="#FFF4E2" stroke-width="18" stroke-linejoin="round" d="{m.group(3)}"/>'
dark = logo[:m.start(2)] + sticker + logo[m.start(2):]
w0 = dark.index('<g id="wordmark">')
dark = dark[:w0] + dark[w0:].replace('fill="#3c0a2f"', 'fill="#FFF4E2"', 1)
open(f'{B}/slothrise-logo-on-dark.svg', 'w').write(dark)
# ---- icon v2: user's sloth, smaller and centred, on a brighter violet dawn
icon = open(f'{B}/slothrise-icon.svg').read()
paths = re.findall(r'<path [^>]*/>', icon)
lav = paths[-1]; colour_paths = paths[1:-1]
d = re.search(r' d="([^"]+)"', lav).group(1)
subs = re.split(r'(?= M)', d)          # first subpath is the tile, the rest are the head's silhouette
outline_d = ''.join(subs[1:]).strip()
rays = ''.join(f'<path d="M{302.5+math.cos(a)*215:.0f} {470-math.sin(a)*215:.0f}L{302.5+math.cos(a)*262:.0f} {470-math.sin(a)*262:.0f}"/>'
               for a in map(math.radians, (10, 32, 148, 170)))
def make(rx, name):
    open(f'{B}/{name}', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 605 605" role="img" aria-labelledby="title"><title id="title">Slothrise</title>
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B3DF0"/><stop offset="1" stop-color="#C46BFF"/></linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE14D"/><stop offset="1" stop-color="#FF8A3D"/></linearGradient>
<clipPath id="tile"><rect width="605" height="605" rx="{rx}"/></clipPath></defs>
<g clip-path="url(#tile)"><rect width="605" height="605" fill="url(#bg)"/>
<g stroke="#FFD93D" stroke-width="20" stroke-linecap="round" opacity=".9">{rays}</g>
<circle cx="302.5" cy="470" r="190" fill="url(#sun)"/><rect y="500" width="605" height="105" fill="#4A22B8"/>
<g transform="translate(302.5 292) scale(0.8) translate(-304 -292)">
<path fill="#3c0a2f" fill-rule="evenodd" d="{outline_d}"/>
{chr(10).join(colour_paths)}
</g></g></svg>
''')
make(135, 'slothrise-icon-v2.svg'); make(0, 'slothrise-icon-v2-square.svg')
print('ok', len(subs))
