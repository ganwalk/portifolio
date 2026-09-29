# Vídeo demonstração

Peça de pouco mais de um minuto pra apresentar o trabalho e convidar a pessoa a fechar um
projeto. Não é gravação de tela do portfólio: é uma peça própria, feita com
os mesmos artefatos do site (retículo de Bayer, retrato girando em folha de
sprite, lente de inversão com lupa, arte ASCII, grade que se distorce sob o
cursor, cortina de faixas), pra que site e vídeo pareçam parte do mesmo
todo.

Cada projeto do site aparece como a solução que ele prova, não pelo nome.
No fim, no lugar do link do portfólio, entram os contatos.

Saídas em `out/`:

- `armando-custodio-16x9.mp4` (1920×1080, 30fps, com trilha)
- `armando-custodio-9x16.mp4` (1080×1920, 30fps, com trilha)

## Roteiro

| Tempo | Cena | O que mostra |
| ----- | ---- | ------------ |
| 0:00 | Abertura | "você tem uma ideia. eu faço ela existir na tela.", digitado em mono sobre preto |
| 0:03 | Hero | Nome gigante, retrato girando, roleta "Designer de" trocando junto com a expressão, lente invertendo e inchando o nome sob o cursor |
| 0:10 | Índice | "Coisas que eu já coloquei no ar e posso fazer por você.", com a lista terminando em "E muito +" |
| 0:14 | Identidade interativa | Arte ASCII "ganwalk" gerada ao vivo, letras fugindo do cursor (Ganwalk) |
| 0:19 | Mundos 3D | O deserto em Three.js gravado do site real, painel retrô ao lado (Dezert Horse) |
| 0:25 | Tipografia viva | Nome em partículas com física de mola (Pink Opala) |
| 0:31 | Design System | Peça de motion da intranet, 110, 70 e 10 contando |
| 0:37 | Landing pages | As onze LPs reais rolando em colunas, 20 mil+, 90+ e 8%+ |
| 0:43 | Ilustração, animação e som | Os três cartões do bloco Extras com dither dissolvendo no hover |
| 0:49 | Marcas | "Falta a sua marca aqui.", grade com as logos e o espaço "SUA MARCA" que a mão aperta |
| 0:53 | Contato | "Vamos conversar?", email, WhatsApp, Instagram, LinkedIn e GitHub, e a mão passeando pela foto em grade até o fim |

A trilha é sintetizada do zero em `scripts/soundtrack.mjs` (120 BPM, lá
menor), sem nenhuma amostra de terceiros, com cada corte de imagem caindo
numa batida. Pra trocar por uma música própria, substitua
`.cache/soundtrack.wav` antes de renderizar.

## Como gerar

Ferramentas de bancada, fora do `package.json` (mesmo padrão dos scripts de
mídia do site):

```bash
npm install --no-save playwright @ffmpeg-installer/ffmpeg sharp

# 1. Quadros dos vídeos dos projetos
node video-demo/scripts/prepare-media.mjs

# 2. Dezert Horse gravado do site real (WebGL por software, demora)
git clone --depth 1 https://github.com/ganwalk/cavalo ../cavalo
node video-demo/scripts/record-dezert-horse.mjs 1920 1080 dh169b ../cavalo
node video-demo/scripts/record-dezert-horse.mjs 1080 1920 dh916 ../cavalo
node video-demo/scripts/record-dezert-horse.mjs 1280 720 panel ../cavalo

# 3. Trilha
node video-demo/scripts/soundtrack.mjs

# 4. Render
node video-demo/scripts/render.mjs --ar 16x9
node video-demo/scripts/render.mjs --ar 9x16
```

Tudo que é intermediário mora em `.cache/` (fora do git). Pra conferir um
instante sem renderizar tudo: `--stills 4.5,20,55` salva PNGs em
`.cache/stills`.

A composição também roda ao vivo no navegador: suba qualquer servidor
estático na raiz do repositório e abra
`/video-demo/composition/index.html?ar=16x9` (ou `9x16`). Clique pausa.

## Onde mexer

- Tempos das cenas e transições: `composition/timeline.js` (a trilha lê os
  mesmos tempos).
- Textos e layout de cada cena: `composition/main.js`, objeto `SCENE`.
- Regras de copy de sempre: sem travessão, meia risca nem sublinhado, e o
  globo é o único emoji (ver `docs/tom-de-voz.md`). Sem rótulo pequeno
  acima dos títulos: cada cena abre direto no título.
