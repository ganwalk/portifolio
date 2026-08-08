// Converte a foto do Contato em WebP no tamanho que o site usa.
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do site):
//
//   npm install --no-save sharp
//   node scripts/build-contact-photo.mjs
//
// A foto tem o mesmo tratamento de gravura do retrato da hero (linhas
// onduladas em meio tom), e é isso que manda no ajuste: trama fina é ruído de
// alta frequência, o pior caso para qualquer compressor. A mesma imagem sai
// com 76 KB quando é uma foto lisa e passa de 400 KB quando é a versão com
// trama, na mesma resolução e qualidade.
//
// Por isso a qualidade é baixa, o mesmo 28 que build-frames.mjs usa pelo mesmo
// motivo: de 18 a 62 o resultado é visualmente indistinguível (a trama já é
// quase binária, então não sobra gradiente sutil pro compressor estragar) e o
// arquivo varia quase o dobro. 28 é o número já estabelecido no projeto pra
// esse desenho, e consistência vale mais que os poucos KB abaixo dele.
//
// A resolução acompanha a que o layout já usava: a foto ocupa metade da tela
// no desktop, então 1050px de largura cobre a exibição com folga sem forçar o
// navegador a reamostrar a trama a ponto de criar moiré.

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// fileURLToPath, e não url.pathname: a pasta de origem tem espaço no nome, e
// pathname devolveria "frames%20eu", que não existe no disco.
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../frames eu/WhatsApp Image 2026-08-08 at 12.33.01.jpeg");
const OUT_DIR = here("../public/photos");
const OUT = `${OUT_DIR}/armando-contato.webp`;
const WIDTH = 1050;
const HEIGHT = 1400;
const QUALITY = 28;

await mkdir(OUT_DIR, { recursive: true });

await sharp(SRC)
  // lanczos3, e não o padrão: a trama é o assunto da imagem, e um filtro mais
  // mole a borra a ponto de virar cinza chapado em vez de linha.
  .resize(WIDTH, HEIGHT, { fit: "cover", kernel: "lanczos3" })
  // A origem já é neutra (os três canais têm a mesma média), então isto não
  // muda o que se vê: só tira um terço dos dados antes de comprimir.
  .grayscale()
  .webp({ quality: QUALITY, effort: 6 })
  .toFile(OUT);

const { size } = await stat(OUT);
console.log(`${OUT.split("/").pop()}: ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(0)} KB`);
