# Vídeo de demonstração do portfólio

Peça de motion em 16:9 e 9:16 que apresenta o que eu faço, na mesma
linguagem visual do site: preto e branco, cor só na mídia dos projetos,
retrato em flipbook, lente que inverte tinta e papel, retículo de Bayer,
cortina de réguas, a mão como cursor e a grade que se deforma no contato.

Não é gravação de tela do portfólio. Cada projeto aparece como a solução
que ele prova (identidade visual interativa, universos 3D, sites para
artistas, Design Systems, landing pages), e o fechamento traz os contatos
no lugar do link.

## Saída

- `saida/armando-custodio-demo-16x9.mp4` (1920 × 1080, 30 fps)
- `saida/armando-custodio-demo-9x16.mp4` (1080 × 1920, 30 fps)

Sem trilha: o site é silencioso por decisão (ver `docs/architecture.md`), e o
vídeo segue a mesma regra. Se for pra rede social, a música entra na edição
de lá.

## Roteiro

| Tempo       | Cena                                                          |
| ----------- | ------------------------------------------------------------- |
| 0 a 6 s     | Hero: retrato nasce do retículo, nome sobe, roleta do subtítulo, lente e clique em "Veja meu trabalho" |
| 6 a 10 s    | Manifesto: "Design e código na mesma pessoa." sobre campo de pontos de Bayer |
| 10 a 38 s   | Cinco soluções, cada uma nascendo do retículo por cima da anterior |
| 38 a 43 s   | Extras: ilustração, animação e produção musical com o dither vivo dos cartões |
| 43 a 47 s   | Marcas, com o espaço vazio "Sua marca" que a mão aperta         |
| 47 a 55 s   | Contato: "Vamos conversar?", grade interativa da foto e os contatos |

## Como gerar de novo

Precisa de `ffmpeg`, Node 22 e o Playwright global do ambiente (o mesmo
Chromium que já vem instalado).

```bash
npm ci                                  # fontes vêm de node_modules
./video-demo/preparar-midia.sh          # quadros das mídias locais

# Sites publicados, gravados ao vivo com relógio virtual (WebGL emulado é
# lento, então cada quadro é um passo de tempo controlado, sem engasgo):
cd video-demo
node capture-site.mjs https://ganwalk.github.io/cavalo/ .cache/dezert-h 1600 900 12 30
node capture-site.mjs https://ganwalk.github.io/cavalo/ .cache/dezert-v 720 1280 12 30
GANWALK='AUDIO=1 START_SEL=#click-to-start-text WARM=10000 CANVAS=#p1-canvas OVERLAY=1'
env $GANWALK DRAG=0.5,0.33 EVAL="Nav.goToExperience1(); setTimeout(() => document.getElementById('p1-play-btn').click(), 1500)" \
  node capture-site.mjs https://ganwalk.github.io/2026/ .cache/ganwalk-h 1600 900 8 30
env $GANWALK DRAG=0.5,0.3 EVAL="Nav.goToExperience1(); setTimeout(() => document.getElementById('p1-play-btn').click(), 1500)" \
  node capture-site.mjs https://ganwalk.github.io/2026/ .cache/ganwalk-v 720 1280 8 30

# Vídeo final
node render.mjs h
node render.mjs v

# Só alguns quadros, pra revisar sem renderizar tudo
node render.mjs h --stills 3,12,40
```

A composição inteira mora em `composicao/cena.js`: cada quadro é função
pura do tempo (`renderFrame(t)`), então dá pra mexer num trecho e revisar só
aquele instante. Os tempos de cada cena ficam no objeto `T`.

`.cache/` fica fora do git: são quadros extraídos, refeitos pelos comandos
acima.
