// Converte as logos reais das marcas citadas em src/data/brands.ts (ver
// comentário lá) pro preto e branco que o carrossel "Marcas com que já
// trabalhei" usa. Nem silhueta sólida nem grayscale simples resolviam
// sozinhos pras quatro ao mesmo tempo:
//
// - Uma silhueta (todo pixel com opacidade virando preto puro) quebrava
//   Minuto Indie e Hits Perdidos: essas duas desenham a letra em opaco por
//   cima do fundo colorido (não um recorte transparente vazando o fundo,
//   como AUVP e a Defensoria fazem), então virar tudo preto colapsava letra
//   e fundo na mesma mancha, ilegível.
// - Grayscale simples (só dessaturar) deixava a AUVP cinza claro demais,
//   quase some contra fundo branco: a origem é uma cor só, quase sem
//   variação de luminância própria, então normalizar o histograma da tela
//   inteira (que já contém preto de sobra vindo da transparência) não
//   esticava nada de verdade.
//
// A saída: esticar o contraste calculando min/max de luminância só entre os
// pixels OPACOS de cada logo (ignorando a transparência), não da tela
// inteira. Isso preserva o contraste interno de quem já tem variação
// própria (Minuto Indie, Hits Perdidos) e força pro preto sólido quem é
// essencialmente uma cor só sem variação pra esticar (AUVP).
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do
// site):
//
//   npm install --no-save sharp
//   node scripts/build-brand-logos.mjs
//
// As fontes são as URLs oficiais de cada marca (não um agregador de
// terceiro): baixa direto do domínio de cada uma. Se uma marca trocar de
// logo ou o arquivo sair do ar, é só atualizar a URL aqui e rodar de novo.

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const OUT_DIR = here("../public/logos");
const WIDTH = 600;
const HEADERS = { "User-Agent": "Mozilla/5.0" };
// Abaixo disso a variação de luminância própria do logo é ruído de
// antialiasing na borda das formas, não desenho de verdade (a AUVP, um
// preenchimento só, media faixa 82 nesse ruído): mais barato (e mais
// legível) forçar preto sólido do que esticar quase-nada até virar um
// cinza médio sem contraste de verdade.
const FLAT_RANGE_THRESHOLD = 100;

const LOGOS = [
  {
    slug: "auvp",
    url: "https://auvpcapital.com.br/wp-content/uploads/2025/03/AUVP-CAPITAL-HORIZONTAL-AMARELA.svg",
  },
  {
    slug: "minuto-indie",
    url: "https://minutoindie.com/wp-content/themes/minuto-indie/assets/images/logo.png",
  },
  {
    slug: "hits-perdidos",
    url: "https://hitsperdidos.com/wp-content/uploads/2021/07/Logo_Hits_Perdidos-01.png",
  },
  {
    slug: "defensoria-goias",
    url: "https://www2.defensoria.go.def.br/dpe-logo.svg",
  },
  {
    slug: "mais-saude",
    url: "https://www.maissaudecorretora.com.br/assets/images/logo-mais-saude.webp",
  },
  {
    slug: "hapvida",
    url: "https://www2.hapvida.com.br/image/layout_set_logo?img_id=12975833&t=1787837857743",
  },
  {
    // Não existe um logotipo próprio de "Vivo Fibra": é a mesma marca vivo
    // (roxo, minúsculo) usada em qualquer produto da Telefônica Brasil,
    // "Fibra" é rótulo de produto em texto solto ao lado dela, não parte do
    // desenho. vivo.com.br fica atrás de um desafio Cloudflare que bloqueia
    // fetch automatizado (testado, 403 em qualquer User-Agent); a origem
    // aqui é o arquivo que o próprio infobox da Wikipédia em inglês usa pra
    // "Vivo (telecommunications company)", a operadora brasileira da
    // Telefônica, não a fabricante chinesa de celulares "vivo" (marca
    // homônima, empresa diferente).
    slug: "vivo-fibra",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Logo_Vivo_Purpura_Positivo.svg",
  },
];

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

async function toMonochrome(buffer, outFile) {
  const { data, info } = await sharp(buffer, { density: 300 })
    .resize({ width: WIDTH, withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const l = luma(data[i], data[i + 1], data[i + 2]);
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const range = max - min;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const l = luma(data[i], data[i + 1], data[i + 2]);
    const stretched = range < FLAT_RANGE_THRESHOLD ? 0 : Math.round(((l - min) / range) * 255);
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 90 })
    .toFile(outFile);

  const { size } = await stat(outFile);
  console.log(`${outFile.split("/").pop()}: faixa de luminância ${range.toFixed(0)}, ${(size / 1024).toFixed(1)} KB`);
}

await mkdir(OUT_DIR, { recursive: true });

for (const { slug, url } of LOGOS) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await toMonochrome(buffer, `${OUT_DIR}/${slug}.webp`);
}
