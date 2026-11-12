import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
font = TTFont(sys.argv[1]); text = sys.argv[2]
gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font['hmtx']
upm = font['head'].unitsPerEm; asc = font['hhea'].ascent
x = 0; parts = []
for ch in text:
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, asc)))
    parts.append(pen.getCommands()); x += hmtx[g][0]
print(json.dumps({"d": " ".join(parts), "width": x, "upm": upm, "asc": asc, "capH": getattr(font['OS/2'], 'sCapHeight', 0), "desc": font['hhea'].descent}))
