// Dither ordenado (matriz de Bayer), o motor por trás do efeito animado dos
// cartões do Playground (ver useBayerDither.ts). Matriz portada de
// Dithering Studio (github.com/Oslonline/dithering-studio, Apache 2.0,
// "Built upon Steinberg Image – Dithering Studio by Oslo418"): a construção
// recursiva de buildBayer é a mesma de src/utils/algorithms/bayer.ts de lá.
//
// Três diferenças da fonte original, deliberadas:
//
// 1. Luminância de verdade (Rec. 601, 0.299R + 0.587G + 0.114B) em vez de só
//    ler o canal vermelho como se já fosse cinza (o que o bayer.ts de lá
//    faz): importa aqui porque a luz de palco rosa/roxa do vídeo da
//    produção musical tem canais bem desbalanceados, e vermelho sozinho
//    daria um limiar errado.
// 2. Máscara de cor, não posterização: onde a luminância bate o limiar da
//    matriz, o pixel de saída é a cor ORIGINAL, sem alteração; abaixo do
//    limiar, preto. O motor original sempre converte pra preto e branco (ou
//    pra uma paleta fixa); aqui o objetivo é um retículo pontilhado que
//    ainda deixa a cor do vídeo aparecer nos pontos "acesos", não uma
//    imagem monocromática.
// 3. `bias` desloca o limiar pra cima (ver parâmetro abaixo): sem ele, uma
//    peça clara (a maioria das ilustrações do Playground, fundos e cores
//    vivas bem acima do meio-tom) quase não tinha pixel abaixo do limiar
//    da matriz, e o retículo ficava fraco demais pra ler como dither numa
//    peça dessas, mesmo já visível numa cena escura como a do vídeo da
//    produção musical. Um viés fixo garante retículo forte em qualquer
//    peça, clara ou escura, não só nas mais escuras.

const bayerCache = new Map<number, Uint16Array>();

function buildBayer(size: number): Uint16Array {
  const cached = bayerCache.get(size);
  if (cached) return cached;

  let m: number[] = [0];
  let s = 1;
  while (s < size) {
    const next = s * 2;
    const grown = new Array(next * next);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = m[y * s + x];
        grown[y * next + x] = 4 * v;
        grown[y * next + (x + s)] = 4 * v + 2;
        grown[(y + s) * next + x] = 4 * v + 3;
        grown[(y + s) * next + (x + s)] = 4 * v + 1;
      }
    }
    m = grown;
    s = next;
  }

  const matrix = new Uint16Array(m);
  bayerCache.set(size, matrix);
  return matrix;
}

export interface DitherPhase {
  /** Deslocamento da matriz em x, em células (0 até matrixSize exclusive). */
  x: number;
  /** Deslocamento da matriz em y, em células. */
  y: number;
}

/**
 * Desenha `source` (vídeo ou imagem) em `ctx`, dessaturado por um retículo
 * de Bayer: cor original nos pixels acima do limiar da matriz, preto nos
 * demais. `matrixSize` é sempre potência de 2 (2, 4, 8...); `phase` desloca
 * a matriz célula a célula pra animar a cintilação sem redesenhar a fonte
 * de novo (ver useBayerDither.ts, que só redesenha a fonte quando ela muda
 * de verdade, e chama esta função a cada quadro só pelo reposicionamento).
 *
 * `sourceWidth`/`sourceHeight`: dimensão natural da fonte, pra recortar
 * como object-cover (preenche o quadrado inteiro, sem esticar) em vez de
 * espremer a imagem toda ali dentro. As galerias do Playground têm peças
 * de proporções bem diferentes (quadradas, retrato...), a mesma vitrine
 * logo abaixo já usa object-cover; sem o mesmo recorte aqui, o instante em
 * que o dither dissolve no hover vinha com um "pulo" de proporção.
 *
 * `bias`: soma ao limiar da matriz (0 a 255) antes de comparar com a
 * luminância, deslocando pra cima quantos pixels caem abaixo dele. Ver a
 * nota 3 no topo do arquivo.
 */
export function ditherFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  matrixSize: number,
  phase: DitherPhase,
  bias: number,
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const matrix = buildBayer(matrixSize);
  const mask = matrixSize - 1;
  const denom = matrixSize * matrixSize;
  const scale255 = 255 / denom;

  for (let y = 0; y < height; y++) {
    const row = ((y + phase.y) & mask) * matrixSize;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const col = (x + phase.x) & mask;
      const threshold = matrix[row + col] * scale255 + bias;
      if (luminance < threshold) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
}
