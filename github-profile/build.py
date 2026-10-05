"""Gera os SVGs do README de perfil do GitHub (github.com/ganwalk).

O GitHub não carrega fonte externa dentro de README, e embutir a Whyte
Inktrap (licenciada) num SVG público seria redistribuir o arquivo da fonte.
Por isso todo texto vira contorno (path): o desenho das letras aparece igual
ao site, sem nenhuma fonte viajar junto.

Cada peça sai em duas versões, clara e escura, com os mesmos tokens de
src/app/globals.css. O README escolhe entre elas com <picture> e
prefers-color-scheme, que segue o tema escolhido no próprio GitHub.

Uso (na raiz do repositório):
    pip install fonttools brotli uharfbuzz pillow numpy
    python3 github-profile/build.py
"""

import base64
from html import escape
from io import BytesIO
from pathlib import Path

import numpy as np
import uharfbuzz as hb
from PIL import Image
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "assets"
FONTS = ROOT / "src" / "fonts"

# Mesmos tokens do tema claro e escuro do site (globals.css).
THEMES = {
    "light": {"name": "light", "bg": "#ffffff", "ink": "#0b0b0b", "muted": "#6d6d6d"},
    "dark": {"name": "dark", "bg": "#0a0a0a", "ink": "#f4f4f4", "muted": "#9b9b9b"},
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


# Retrato em flipbook da hero (public/frames, folha 4 x 4). Mesma sequência e
# mesma batida de src/lib/portrait-frames.ts: quatro voltas iguais, cada uma
# fechando numa expressão diferente que segura mais tempo.
PORTRAIT_SHEET = ROOT / "public" / "frames" / "eu-lg.webp"
BASE_FRAMES = list(range(1, 13))
ENDING_FRAMES = [13, 14, 15, 16]
FRAME_MS = 85
ENDING_MS = 700
CYCLE_MS = len(BASE_FRAMES) * FRAME_MS + ENDING_MS

# Dither ordenado (Bayer 4 x 4): o padrão é fixo no espaço, então o retrato
# troca de quadro sem a textura cintilar, ao contrário de difusão de erro.
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32
# Cada ponto do dither vale 2 unidades do viewBox: no README (cerca de 830px
# de largura) isso dá um ponto por pixel de tela, fino mas ainda visível.
DITHER_PX = 2


def hex_rgb(color: str) -> tuple:
    return tuple(int(color[i : i + 2], 16) for i in (1, 3, 5))


def bayer(lum: np.ndarray) -> np.ndarray:
    h, w = lum.shape
    tile = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    return lum > tile


def png_uri(bits: np.ndarray, on: str, off: str) -> str:
    """PNG de 1 bit com paleta de duas cores, embutido como data URI."""
    im = Image.fromarray(bits.astype(np.uint8), "P")
    im.putpalette(list(hex_rgb(off)) + list(hex_rgb(on)))
    buf = BytesIO()
    im.save(buf, "PNG", bits=1, optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def portrait_strip(width: int) -> tuple[np.ndarray, int, int]:
    """Os 16 quadros lado a lado, já em 1 bit. True = tom claro."""
    sheet = Image.open(PORTRAIT_SHEET).convert("RGBA")
    fw, fh = sheet.width // 4, sheet.height // 4
    dw = width // DITHER_PX
    dh = round(fh * dw / fw)
    strip = np.zeros((dh, dw * 16), dtype=bool)
    alpha = np.zeros((dh, dw * 16), dtype=bool)
    for i in range(16):
        col, row = i % 4, i // 4
        frame = sheet.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))
        frame = frame.resize((dw, dh), Image.LANCZOS)
        a = np.asarray(frame)[..., 3] > 127
        lum = np.asarray(frame.convert("L"), dtype=float) / 255
        # Mais contraste antes do dither: o grão da foto original já é
        # textura, e sem esse empurrão o rosto vira um cinza chapado.
        lum = np.clip((lum - 0.5) * 1.15 + 0.44, 0, 1)
        strip[:, i * dw : (i + 1) * dw] = bayer(lum)
        alpha[:, i * dw : (i + 1) * dw] = a
    return strip, alpha, dw, dh


def flipbook_keyframes(frame_w: float) -> tuple[str, float]:
    steps = []
    for ending in ENDING_FRAMES:
        steps += [(f, FRAME_MS) for f in BASE_FRAMES] + [(ending, ENDING_MS)]
    total = sum(hold for _, hold in steps)
    t = 0
    frames = []
    for frame, hold in steps:
        frames.append(f"{t / total * 100:.3f}%{{transform:translateX({-(frame - 1) * frame_w:.1f}px)}}")
        t += hold
    return "".join(frames), total / 1000


def dither_fade(width: int, height: int) -> np.ndarray:
    """Degradê vertical em Bayer, do papel (em cima) até a tinta (embaixo)."""
    dw, dh = width // DITHER_PX, height // DITHER_PX
    lum = np.repeat(np.linspace(1, 0, dh)[:, None], dw, axis=1)
    return ~bayer(lum)  # True = tinta


def header(theme: dict) -> str:
    w, h = 1600, 780
    pad = 64
    mono = 22

    top_left = MONO.path("DESIGN ENGINEER", mono, pad, 92)
    top_right_text = "GOIÂNIA, BRASIL"
    top_right = MONO.path(top_right_text, mono, w - pad - MONO.width(top_right_text, mono), 92)

    # Retrato com dither à direita, nome em duas linhas à esquerda.
    # A coluna do retrato continua com 420 de largura (é ela que define o
    # tamanho do nome), mas o retrato ocupa 360 dela, centralizado, e para
    # 40 unidades acima da linha, sem encostar.
    column_w = 420
    portrait_w = 360
    portrait_gap = 40
    strip, alpha, dw, dh = portrait_strip(portrait_w)
    portrait_h = dh * DITHER_PX
    rule_y = 640
    px = w - pad - column_w + (column_w - portrait_w) // 2
    py = rule_y - portrait_gap - portrait_h
    # Claro do retrato: no tema claro é o papel, no escuro é a tinta. A foto
    # nunca fica em negativo, só o fundo troca.
    light, dark = (theme["bg"], theme["ink"]) if theme["name"] == "light" else (theme["ink"], theme["bg"])
    # Fora da silhueta é sempre fundo: claro no tema claro, escuro no escuro.
    bits = np.where(alpha, strip, theme["name"] == "light")
    # Borda de adesivo em tom claro, dois pontos em volta da silhueta. No tema
    # claro ela se confunde com o papel; no escuro é o que separa o cabelo
    # (preto) do fundo (preto).
    ring = np.zeros_like(alpha)
    r = 2
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                ring |= np.roll(np.roll(alpha, dy, axis=0), dx, axis=1)
    bits = np.where(ring & ~alpha, True, bits)
    strip_uri = png_uri(bits, light, dark)
    flip, flip_total = flipbook_keyframes(portrait_w)

    name_w = w - pad - column_w - pad - 48
    size = name_w / max(INKTRAP.width("Armando", 1), INKTRAP.width("Custodio", 1))
    line1 = INKTRAP.path("Armando", size, pad, 120 + size * 0.78)
    line2 = INKTRAP.path("Custodio", size, pad, 120 + size * 1.66)

    # "Designer de" fixo + roleta. A palavra troca no mesmo instante em que o
    # retrato entra numa expressão, igual à hero: um relógio só.
    sub_size = 60
    sub_y = rule_y - 52
    prefix_w = SWITZER.width(SUBTITLE_PREFIX + " ", sub_size)
    prefix = SWITZER.path(SUBTITLE_PREFIX, sub_size, pad, sub_y)
    step = 84
    words = SUBTITLE_WORDS + [SUBTITLE_WORDS[0]]
    word_paths = "".join(
        f'<path d="{SWITZER_ITALIC.path(word, sub_size, pad + prefix_w, sub_y + i * step)}"/>'
        for i, word in enumerate(words)
    )
    n = len(SUBTITLE_WORDS)
    total_ms = n * CYCLE_MS
    turn_at = len(BASE_FRAMES) * FRAME_MS  # quando a expressão entra
    move_ms = 380
    frames = ["0%{transform:translateY(0px)}"]
    for i in range(n):
        start = i * CYCLE_MS + turn_at
        frames.append(
            f"{start / total_ms * 100:.3f}%{{transform:translateY({-i * step}px);"
            "animation-timing-function:cubic-bezier(.77,0,.18,1)}"
        )
        frames.append(f"{(start + move_ms) / total_ms * 100:.3f}%{{transform:translateY({-(i + 1) * step}px)}}")
    frames.append(f"100%{{transform:translateY({-n * step}px)}}")
    keyframes = "".join(frames)

    facts = "UX/UI · WEBAPPS · DESIGN SYSTEMS"
    facts_path = MONO.path(facts, mono, pad, rule_y + 46)
    url = "GANWALK.GITHUB.IO/PORTIFOLIO"
    url_path = MONO.path(url, mono, w - pad - MONO.width(url, mono), rule_y + 46)

    # Pé do cabeçalho: o papel vira tinta em dither, e emenda no letreiro
    # logo abaixo, que é todo tinta.
    fade_h = h - (rule_y + 80)
    fade_uri = png_uri(dither_fade(w, fade_h), theme["ink"], theme["bg"])

    pixel = 'image-rendering="optimizeSpeed" style="image-rendering:pixelated"'
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">
<title id="t">Armando Custodio, Design Engineer. Retrato em dither girando ao lado do nome. Designer de produtos, experiências, aplicativos, interfaces, sistemas, músicas, sonhos, embalagens e sites.</title>
<style>
.roleta{{animation:roleta {total_ms / 1000:.2f}s linear infinite}}
@keyframes roleta{{{keyframes}}}
.giro{{animation:giro {flip_total:.2f}s step-end infinite}}
@keyframes giro{{{flip}}}
@media (prefers-reduced-motion:reduce){{.roleta,.giro{{animation:none}}}}
</style>
<defs>
<clipPath id="linha"><rect x="0" y="{sub_y - 62}" width="{px - 24}" height="{step}"/></clipPath>
<clipPath id="quadro"><rect x="{px}" y="{py}" width="{portrait_w}" height="{portrait_h}"/></clipPath>
</defs>
<rect width="{w}" height="{h}" fill="{theme['bg']}"/>
<g fill="{theme['muted']}"><path d="{top_left}"/><path d="{top_right}"/></g>
<path fill="{theme['ink']}" d="{line1}{line2}"/>
<g clip-path="url(#quadro)"><image class="giro" x="{px}" y="{py}" width="{portrait_w * 16}" height="{portrait_h}" preserveAspectRatio="none" {pixel} href="{strip_uri}"/></g>
<path fill="{theme['muted']}" d="{prefix}"/>
<g clip-path="url(#linha)"><g class="roleta" fill="{theme['ink']}">{word_paths}</g></g>
<rect x="{pad}" y="{rule_y}" width="{w - 2 * pad}" height="2" fill="{theme['ink']}"/>
<g fill="{theme['muted']}"><path d="{facts_path}"/><path d="{url_path}"/></g>
<image x="0" y="{h - fade_h}" width="{w}" height="{fade_h}" preserveAspectRatio="none" {pixel} href="{fade_uri}"/>
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
