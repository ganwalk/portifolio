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

## O que é gravado do site de verdade

Tudo que se mexe na landing entra no reel se mexendo, filmado do próprio
site rodando (o build estático em `out/`), não recriado nem fotografado:

| Tomada              | O que o site faz nela                                             |
| ------------------- | ----------------------------------------------------------------- |
| `hero`              | tela de entrada com as luas, cortina, nome, retrato em flipbook, roleta do subtítulo e a lente de vidro (WebGL) seguindo o mouse |
| `project-ganwalk`   | o ASCII âmbar ao vivo do card                                      |
| `project-dezert`    | o site do Dezert Horse rodando dentro do card (Three.js)           |
| `project-pink`      | as partículas do Pink Opala reagindo ao mouse                      |
| `project-intranet`  | a grade animada do Design System (no vertical, o carrossel mobile) |
| `project-landing`   | as fileiras de landing pages deslizando                            |
| `skills`            | a corrente de habilidades presa ao cursor e a frase no fim         |
| `extras`            | letreiro de marcas, rolagem suave e o dither dos cartões se desfazendo no hover |
| `contact`           | a grade "Fale comigo!" crescendo sob o mouse                       |

O capturador (`capture/`) abre o site num Chromium com **relógio virtual**
(`capture/timeshim.js`): requestAnimationFrame, timers, animações CSS, Web
Animations e vídeos só andam quando ele manda, 1/60s por passo. Por isso
cada quadro sai exatamente no seu instante, por mais que o screenshot
demore, e o WebGL rodando em software não faz o vídeo engasgar. O site é
servido no mesmo endereço de produção (`ganwalk.github.io/portifolio`),
interceptando as requisições, pra o iframe do Dezert Horse funcionar como
no ar. O cursor do site é CSS e não sai em screenshot: cada tomada guarda a
posição do mouse, e a composição desenha o mesmo sprite, com o mesmo ponto
de clique.

Por cima das tomadas, a composição (`composition.js`) só costura: manifesto
com o retrato em retícula, títulos e métricas reais dos cases, passagens
pela matriz de Bayer, lentes invertidas e cortina de réguas nas viradas, e a
assinatura final.

## Como gerar de novo

```bash
npm i --no-save playwright-core                 # só pra filmar e renderizar
NEXT_PUBLIC_BASE_PATH=/portifolio npx next build  # o site como está no ar
node video/capture/shoot.mjs landscape          # filma as tomadas (demora)
node video/capture/shoot.mjs portrait
node video/render.mjs landscape                 # → video/out/reel-16x9.mp4
node video/render.mjs portrait                  # → video/out/reel-9x16.mp4
```

Precisa de `ffmpeg` e `curl` no PATH. Se o Chromium não estiver no lugar
padrão do Playwright, aponte `CHROMIUM_PATH` pro executável. Dá pra refilmar
só uma tomada (`node video/capture/shoot.mjs portrait contact`) e conferir
um instante sem renderizar tudo (`node video/render.mjs portrait --stills 4.5,17`).
