"""Gera os SVGs do README de perfil do GitHub (github.com/ganwalk).

O GitHub não carrega fonte externa dentro de README, e embutir a Whyte
Inktrap (licenciada) num SVG público seria redistribuir o arquivo da fonte.
Por isso todo texto vira contorno (path): o desenho das letras aparece igual
ao site, sem nenhuma fonte viajar junto.

Cada peça sai em duas versões, clara e escura, com os mesmos tokens de
src/app/globals.css. O README escolhe entre elas com <picture> e
prefers-color-scheme, que segue o tema escolhido no próprio GitHub.

Uso (na raiz do repositório):
    pip install fonttools brotli uharfbuzz
    python3 github-profile/build.py
"""

from html import escape
from io import BytesIO
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "assets"
FONTS = ROOT / "src" / "fonts"

# Mesmos tokens do tema claro e escuro do site (globals.css).
THEMES = {
    "light": {"bg": "#ffffff", "ink": "#0b0b0b", "muted": "#6d6d6d"},
    "dark": {"bg": "#0a0a0a", "ink": "#f4f4f4", "muted": "#9b9b9b"},
}

# Mesma roleta da hero (pt.hero.subtitleWords): a primeira é o descanso.
SUBTITLE_PREFIX = "Designer de"
SUBTITLE_WORDS = [
    "produtos",
    "experiências",
    "aplicativos",
    "interfaces",
    "sistemas",
    "músicas",
    "sonhos",
    "embalagens",
    "sites",
]

# Habilidades e ferramentas, na ordem de src/data/profile.ts.
MARQUEE_ITEMS = [
    "UX/UI Design",
    "Protótipos de alta fidelidade",
    "Design Systems",
    "HTML",
    "React",
    "TypeScript",
    "Figma",
    "Adobe CC",
    "Microsoft Clarity",
    "Google Analytics",
    "Animação",
    "Ilustração & colagem",
    "Produção musical",
    "Edição de vídeo",
]


class Font:
    def __init__(self, path: Path):
        tt = TTFont(path)
        tt.flavor = None
        buf = BytesIO()
        tt.save(buf)
        self.tt = TTFont(BytesIO(buf.getvalue()))
        self.glyphs = self.tt.getGlyphSet()
        self.upem = self.tt["head"].unitsPerEm
        face = hb.Face(buf.getvalue())
        self.hb = hb.Font(face)

    def shape(self, text: str):
        b = hb.Buffer()
        b.add_str(text)
        b.guess_segment_properties()
        hb.shape(self.hb, b, {"kern": True, "liga": True})
        order = self.tt.getGlyphOrder()
        return [
            (order[i.codepoint], p.x_advance, p.x_offset, p.y_offset)
            for i, p in zip(b.glyph_infos, b.glyph_positions)
        ]

    def width(self, text: str, size: float) -> float:
        return sum(adv for _, adv, _, _ in self.shape(text)) * size / self.upem

    def path(self, text: str, size: float, x: float, y: float) -> str:
        """Contorno do texto com a linha de base em (x, y)."""
        scale = size / self.upem
        pen = SVGPathPen(self.glyphs, ntos=lambda n: f"{n:.1f}".rstrip("0").rstrip("."))
        cursor = 0
        for name, adv, xo, yo in self.shape(text):
            t = (scale, 0, 0, -scale, x + (cursor + xo) * scale, y - yo * scale)
            self.glyphs[name].draw(TransformPen(pen, t))
            cursor += adv
        return pen.getCommands()


INKTRAP = Font(FONTS / "whyte-inktrap" / "WhyteInktrap-Black.woff2")
SWITZER = Font(FONTS / "switzer" / "Switzer-Regular.woff2")
SWITZER_ITALIC = Font(FONTS / "switzer" / "Switzer-Italic.woff2")
MONO = Font(FONTS / "og" / "ibm-plex-mono-400.woff")


def header(theme: dict) -> str:
    w, h = 1600, 560
    pad = 64

    top_left = MONO.path("DESIGN ENGINEER", 22, pad, 92)
    top_right_text = "GOIÂNIA, BRASIL"
    top_right = MONO.path(top_right_text, 22, w - pad - MONO.width(top_right_text, 22), 92)

    # O nome ocupa a largura útil inteira, como na hero.
    name = "Armando Custodio"
    size = (w - 2 * pad) / INKTRAP.width(name, 1)
    name_path = INKTRAP.path(name, size, pad, 300)

    # "Designer de" fixo + roleta. Cada palavra mora numa linha própria de
    # uma coluna vertical, e a coluna sobe um degrau por vez atrás de uma
    # máscara da altura de uma linha.
    sub_size = 60
    sub_y = 418
    prefix_w = SWITZER.width(SUBTITLE_PREFIX + " ", sub_size)
    prefix = SWITZER.path(SUBTITLE_PREFIX, sub_size, pad, sub_y)
    step = 84
    words = SUBTITLE_WORDS + [SUBTITLE_WORDS[0]]
    word_paths = "".join(
        f'<path d="{SWITZER_ITALIC.path(word, sub_size, pad + prefix_w, sub_y + i * step)}"/>'
        for i, word in enumerate(words)
    )
    n = len(SUBTITLE_WORDS)
    hold = 2.0
    move = 0.45
    total = n * (hold + move)
    frames = []
    for i in range(n):
        t_hold_end = (i * (hold + move) + hold) / total * 100
        t_next = ((i + 1) * (hold + move)) / total * 100
        frames.append(f"{i * (hold + move) / total * 100:.3f}%{{transform:translateY({-i * step}px)}}")
        frames.append(f"{t_hold_end:.3f}%{{transform:translateY({-i * step}px)}}")
        if i == n - 1:
            frames.append(f"{t_next:.3f}%{{transform:translateY({-(i + 1) * step}px)}}")
    keyframes = "".join(frames)

    rule_y = 478
    facts = "UX/UI · WEBAPPS · DESIGN SYSTEMS"
    facts_path = MONO.path(facts, 22, pad, 524)
    url = "GANWALK.GITHUB.IO/PORTIFOLIO"
    url_path = MONO.path(url, 22, w - pad - MONO.width(url, 22), 524)

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">
<title id="t">Armando Custodio, Design Engineer. Designer de produtos, experiências, aplicativos, interfaces, sistemas, músicas, sonhos, embalagens e sites.</title>
<style>
.roleta{{animation:roleta {total:.2f}s cubic-bezier(.77,0,.18,1) infinite}}
@keyframes roleta{{{keyframes}}}
@media (prefers-reduced-motion:reduce){{.roleta{{animation:none}}}}
</style>
<defs><clipPath id="linha"><rect x="0" y="{sub_y - 62}" width="{w}" height="{step}"/></clipPath></defs>
<rect width="{w}" height="{h}" fill="{theme['bg']}"/>
<g fill="{theme['muted']}"><path d="{top_left}"/><path d="{top_right}"/></g>
<path fill="{theme['ink']}" d="{name_path}"/>
<path fill="{theme['muted']}" d="{prefix}"/>
<g clip-path="url(#linha)"><g class="roleta" fill="{theme['ink']}">{word_paths}</g></g>
<rect x="{pad}" y="{rule_y}" width="{w - 2 * pad}" height="2" fill="{theme['ink']}"/>
<g fill="{theme['muted']}"><path d="{facts_path}"/><path d="{url_path}"/></g>
</svg>
"""


def marquee(theme: dict) -> str:
    """Letreiro contínuo, tinta invertida, mesmo gesto do Marquee.tsx."""
    w, h = 1600, 72
    size = 24
    sep = "  ·  "
    line = sep.join(i.upper() for i in MARQUEE_ITEMS) + sep
    line_w = MONO.width(line, size)
    copies = int(w // line_w) + 2
    # Uma cópia só do contorno, repetida com <use>: metade do peso do arquivo.
    copy = MONO.path(line, size, 0, 45)
    uses = "".join(f'<use href="#linha" x="{k * line_w:.2f}"/>' for k in range(copies))
    duration = line_w / 60  # 60 px por segundo, leitura calma.
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">
<title id="t">{escape(", ".join(MARQUEE_ITEMS))}</title>
<style>
.fita{{animation:fita {duration:.2f}s linear infinite}}
@keyframes fita{{to{{transform:translateX(-{line_w:.2f}px)}}}}
@media (prefers-reduced-motion:reduce){{.fita{{animation:none}}}}
</style>
<defs><path id="linha" d="{copy}"/></defs>
<rect width="{w}" height="{h}" fill="{theme['ink']}"/>
<g class="fita" fill="{theme['bg']}">{uses}</g>
</svg>
"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, theme in THEMES.items():
        (OUT / f"header-{name}.svg").write_text(header(theme), encoding="utf-8")
        (OUT / f"marquee-{name}.svg").write_text(marquee(theme), encoding="utf-8")
    for f in sorted(OUT.iterdir()):
        print(f"{f.relative_to(ROOT)}  {f.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
