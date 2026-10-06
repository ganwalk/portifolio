"""Gera a assinatura de email, na mesma estética do perfil do GitHub.

Email não carrega fonte, CSS externo nem SVG (o Gmail descarta os três). Por
isso o que precisa da identidade vira imagem, e o resto é texto de verdade,
pra continuar legível com as imagens desligadas:

    retrato.gif  o flipbook da hero em dither, girando na mesma batida do site
                 (o Gmail anima GIF; o Outlook mostra só o primeiro quadro,
                 que é o retrato de frente)
    nome.png     "Armando Custodio" em Whyte Inktrap, já em contorno
    fita.png     degradê em dither do papel até a tinta, fecha a assinatura

Tudo em 2x, exibido pela metade, pra ficar nítido em tela de alta densidade.
As imagens moram no repositório ganwalk/ganwalk (pasta assinatura), servidas
pelo raw.githubusercontent.com, e assinatura.html já aponta pra lá.

Uso (na raiz do repositório):
    pip install fonttools brotli uharfbuzz pillow numpy
    python3 assinatura-email/build.py
"""

import sys
from html import escape
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "github-profile"))
import build as perfil  # noqa: E402

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent
HOST = "https://raw.githubusercontent.com/ganwalk/ganwalk/main/assinatura"
# Sobe junto com qualquer imagem nova: o Gmail guarda a imagem pelo endereço.
VERSION = 1

PAPER = "#ffffff"
INK = "#0b0b0b"
MUTED = "#6d6d6d"

PROFILE = {
    "name": "Armando Custodio",
    "role": "Design Engineer",
    "facts": "UX/UI · Webapps · Design Systems",
    "availability": "Baseado no Brasil · Disponível para projetos no mundo todo 🌍",
    "site": "https://ganwalk.github.io/portifolio/",
    "links": [
        ("Portfólio", "https://ganwalk.github.io/portifolio/"),
        ("LinkedIn", "https://br.linkedin.com/in/armando-custodio-00080320a"),
        ("Instagram", "https://www.instagram.com/ganwalk"),
        ("GitHub", "https://github.com/ganwalk"),
    ],
}

PORTRAIT_W = 120  # largura exibida, em px de CSS
# Largura fixa da assinatura inteira: a fita de baixo precisa saber onde termina.
TABLE_W = 520


def retrato() -> tuple[int, int]:
    """Flipbook em dither como GIF de 1 bit, com os tempos da hero."""
    # Um ponto de dither por px de CSS: portrait_strip divide por DITHER_PX.
    strip, alpha, dw, dh = perfil.portrait_strip(PORTRAIT_W * perfil.DITHER_PX)
    bits = np.where(alpha, strip, True)  # fora da silhueta é papel
    palette = list(perfil.hex_rgb(INK)) + list(perfil.hex_rgb(PAPER))

    def frame(n: int) -> Image.Image:
        tile = bits[:, (n - 1) * dw : n * dw].astype(np.uint8)
        im = Image.fromarray(tile, "P").resize((dw * 2, dh * 2), Image.NEAREST)
        im.putpalette(palette)
        return im

    frames, durations = [], []
    for ending in perfil.ENDING_FRAMES:
        for n in perfil.BASE_FRAMES:
            frames.append(frame(n))
            durations.append(perfil.FRAME_MS)
        frames.append(frame(ending))
        durations.append(perfil.ENDING_MS)
    frames[0].save(
        OUT / "retrato.gif",
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=1,
    )
    return dw, dh


def nome() -> tuple[int, int]:
    """O nome em Whyte Inktrap, rasterizado em 2x sobre papel."""
    buf = BytesIO()
    perfil.INKTRAP.tt.save(buf)
    size = 64  # 32px de CSS
    font = ImageFont.truetype(BytesIO(buf.getvalue()), size, layout_engine=ImageFont.Layout.RAQM)
    left, top, right, bottom = font.getbbox(PROFILE["name"])
    pad = 2
    im = Image.new("RGB", (right - left + pad * 2, bottom - top + pad * 2), PAPER)
    ImageDraw.Draw(im).text((pad - left, pad - top), PROFILE["name"], font=font, fill=INK)
    im.save(OUT / "nome.png", optimize=True)
    return im.width // 2, im.height // 2


def fita(width: int) -> tuple[int, int]:
    """Degradê em dither, do papel até a tinta, da esquerda pra direita."""
    h = 8
    lum = np.repeat(np.linspace(1, 0, width)[None, :], h, axis=0)
    bits = perfil.bayer(lum).astype(np.uint8)
    im = Image.fromarray(bits, "P").resize((width * 2, h * 2), Image.NEAREST)
    im.putpalette(list(perfil.hex_rgb(INK)) + list(perfil.hex_rgb(PAPER)))
    im.save(OUT / "fita.png", optimize=True)
    return width, h


def html(portrait: tuple[int, int], name: tuple[int, int], strip: tuple[int, int]) -> str:
    v = f"?v={VERSION}"
    sans = "Helvetica,Arial,sans-serif"
    mono = "'IBM Plex Mono',Menlo,Consolas,'Courier New',monospace"
    link = f"color:{INK};text-decoration:underline;"
    links = ' <span style="color:#6d6d6d;">·</span> '.join(
        f'<a href="{url}" style="{link}">{escape(label)}</a>' for label, url in PROFILE["links"]
    )
    email = "armandocustodio0@gmail.com"
    return f"""<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="{TABLE_W}" style="width:{TABLE_W}px;border-collapse:collapse;font-family:{sans};color:{INK};background:{PAPER};">
  <tr>
    <td width="{portrait[0]}" style="vertical-align:top;padding:0 16px 0 0;width:{portrait[0]}px;">
      <a href="{PROFILE['site']}"><img src="{HOST}/retrato.gif{v}" width="{portrait[0]}" height="{portrait[1]}" alt="Retrato de Armando Custodio" style="display:block;border:0;"></a>
    </td>
    <td style="vertical-align:top;padding:2px 0 0 16px;border-left:2px solid {INK};">
      <img src="{HOST}/nome.png{v}" width="{name[0]}" height="{name[1]}" alt="{PROFILE['name']}" style="display:block;border:0;">
      <div style="font-size:15px;line-height:20px;padding-top:6px;">{PROFILE['role']}</div>
      <div style="font-family:{mono};font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:{MUTED};padding-top:2px;">{escape(PROFILE['facts'])}</div>
      <div style="font-size:13px;line-height:18px;padding-top:12px;">{links}</div>
      <div style="font-size:13px;line-height:18px;"><a href="mailto:{email}" style="{link}">{email}</a></div>
      <div style="font-size:12px;line-height:16px;color:{MUTED};padding-top:8px;">{escape(PROFILE['availability'])}</div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding:14px 0 0 0;">
      <img src="{HOST}/fita.png{v}" width="{strip[0]}" height="{strip[1]}" alt="" style="display:block;border:0;">
    </td>
  </tr>
</table>
"""


def main():
    portrait = retrato()
    name = nome()
    strip = fita(TABLE_W)
    (OUT / "assinatura.html").write_text(html(portrait, name, strip), encoding="utf-8")
    for f in ["retrato.gif", "nome.png", "fita.png", "assinatura.html"]:
        p = OUT / f
        print(f"{p.relative_to(ROOT)}  {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
