# Reel do portfólio

Vídeo de apresentação em dois formatos, gerado a partir dos mesmos artefatos
da landing: o dither de Bayer do Playground, o retrato em flipbook com a
roleta do subtítulo, a lente que inverte tinta e papel, a cortina de réguas,
as prévias dos cases, o cursor customizado e a grade "Fale comigo!".

| Arquivo                  | Formato            | Uso                               |
| ------------------------ | ------------------ | --------------------------------- |
| `out/reel-16x9.mp4`      | 1920×1080, 30 fps  | LinkedIn, Behance, site, YouTube  |
| `out/reel-9x16.mp4`      | 1080×1920, 30 fps  | Reels, Stories, TikTok, Shorts    |

Sem trilha, de propósito: o site é silencioso (ver `docs/architecture.md`) e
o vídeo foi pensado pra funcionar no autoplay mudo das redes. Se quiser som,
é só colocar uma faixa por cima na edição.

## Roteiro (36,5s)

1. **Carregamento** (0 a 2s): contador de 000 a 100 sobre um campo de
   retícula que respira, e a cortina de réguas abre.
2. **Hero** (2 a 9s): o nome sobe linha a linha, o retrato gira no mesmo
   compasso do site e a roleta troca a palavra junto com a expressão. A lente
   passeia pelo nome, pousa no rosto e cresce até inverter a tela inteira.
3. **Manifesto** (9 a 12,6s): "Do banking à música", com o retrato virando
   retícula branca sobre o preto.
4. **Projetos** (12,6 a 25,4s): Ganwalk (no ASCII âmbar do carrossel),
   Pink Opala, Design System e Landing Pages. Cada prévia nasce e morre pela
   matriz de Bayer, com as métricas reais de `src/data/cases.ts`.
5. **Extras** (25,4 a 29,8s): os cartões cintilam no dither do Playground e
   o cursor do site passa desfazendo o efeito, com o letreiro de marcas.
6. **Contato** (29,8 a 33,9s): a grade interativa responde ao cursor, que
   aperta "Fale comigo" e abre a lente final.
7. **Assinatura** (33,9 a 36,5s): retrato em retícula, nome, frase e URL.

## Como gerar de novo

```bash
npm i --no-save playwright-core     # só pra renderizar
node video/prepare-media.mjs        # extrai as prévias pra video/.cache
node video/render.mjs landscape     # → video/out/reel-16x9.mp4
node video/render.mjs portrait      # → video/out/reel-9x16.mp4
```

Precisa de `ffmpeg` no PATH. Se o Chromium não estiver no lugar padrão do
Playwright, aponte `CHROMIUM_PATH` pro executável. Pra conferir um momento
sem renderizar tudo: `node video/render.mjs portrait --stills 4.5,17,31`.

Todo o desenho mora em `composition.js`, e cada quadro é função pura do
tempo, então o mesmo comando sempre gera o mesmo vídeo. Mudou o texto de um
case ou trocou uma prévia? Ajuste lá e renderize de novo.
