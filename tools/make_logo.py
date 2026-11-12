import json, sys, os
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
w = json.load(open(sys.argv[1]))
PLUM, CREAM, FUR, PATCH = '#3B1430', '#F9E2C8', '#FFA07A', '#8E5A55'
def eye(x):
    return (f'<g transform="translate({x} 102)"><circle r="8" cy="1" fill="{PLUM}"/>'
            f'<ellipse cy="-4.5" rx="11.5" ry="8.5" fill="#F6B596"/>'
            f'<path d="M-11.5 0h23" stroke="{PLUM}" stroke-width="5" stroke-linecap="round"/></g>')
HEAD = f'''<g stroke="{PLUM}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
<ellipse cx="100" cy="94" rx="64" ry="56" fill="{FUR}"/>
<ellipse cx="100" cy="103" rx="50" ry="32" fill="{CREAM}" stroke="none"/>
<ellipse cx="75" cy="101" rx="22" ry="13" fill="{PATCH}" stroke="none" transform="rotate(14 75 101)"/>
<ellipse cx="125" cy="101" rx="22" ry="13" fill="{PATCH}" stroke="none" transform="rotate(-14 125 101)"/>
{eye(77)}{eye(123)}
<ellipse cx="60" cy="121" rx="7" ry="4" fill="#FF8FA3" opacity=".6" stroke="none"/><ellipse cx="140" cy="121" rx="7" ry="4" fill="#FF8FA3" opacity=".6" stroke="none"/>
<path d="M94 112q6-4 12 0q-2 6-6 6q-4 0-6-6z" fill="{PLUM}" stroke-width="2.5"/>
<path d="M90 122q5 5 10 0q5 5 10 0" fill="none" stroke-width="4"/>
<g transform="translate(5 -12) scale(.95)"><path d="M34 88C36 42 84 14 132 22C166 28 186 60 186 102L172 108C168 74 150 54 122 48C94 42 60 56 48 92Z" fill="#FFD93D"/>
<path d="M30 92C50 52 134 40 172 78L170 96C132 64 66 70 42 106Z" fill="#FFCB2E"/>
<circle cx="180" cy="114" r="14" fill="#FFE680"/></g>
</g>'''
s = 64 / 700; base = 124; X = 222
word = lambda fill: f'<path transform="translate({X} {base - w["asc"]*s:.2f}) scale({s:.5f})" fill="{fill}" d="{w["d"]}"/>'
right = X + w['width'] * s + 8
def logo(fill, name):
    vb = f'20 -6 {right-20:.0f} 168'
    open(f'{out}/{name}', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Slothrise"><title>Slothrise</title>{HEAD}{word(fill)}</svg>\n')
logo(PLUM, 'slothrise-logo.svg')
logo('#FFF4E2', 'slothrise-logo-on-dark.svg')
open(f'{out}/slothrise-mark.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 -6 182 164" role="img" aria-label="Slothrise"><title>Slothrise</title>{HEAD}</svg>\n')
import math
rays = ''.join(
    f'<path d="M{512+math.cos(a)*370:.0f} {840-math.sin(a)*370:.0f}L{512+math.cos(a)*440:.0f} {840-math.sin(a)*440:.0f}" />'
    for a in [math.radians(d) for d in (12, 34, 56, 124, 146, 168)])
def icon(rx, name):
    open(f'{out}/{name}', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Slothrise app icon"><title>Slothrise</title>
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B3DF0"/><stop offset="1" stop-color="#C46BFF"/></linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE14D"/><stop offset="1" stop-color="#FF8A3D"/></linearGradient>
<clipPath id="c"><rect width="1024" height="1024" rx="{rx}"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="1024" height="1024" fill="url(#bg)"/>
<g stroke="#FFD93D" stroke-width="34" stroke-linecap="round" opacity=".9">{rays}</g>
<circle cx="512" cy="840" r="320" fill="url(#sun)"/>
<rect y="840" width="1024" height="184" fill="#4A22B8"/>
<g transform="translate(115 230) scale(3.55)">{HEAD}</g></g></svg>
''')
icon(228, 'slothrise-icon.svg')
icon(0, 'slothrise-icon-square.svg')
print(sorted(os.listdir(out)), round(right))
