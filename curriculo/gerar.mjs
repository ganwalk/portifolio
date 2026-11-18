#!/usr/bin/env node
// Gerador de currículo: lê um JSON (base.json ou vagas/<slug>/curriculo.json),
// monta um HTML com a estética do portfólio e imprime PDF pelo Chromium do
// Playwright. Junto do PDF saem a versão em texto puro (para colar em
// formulário de ATS), uma prévia em PNG e um relatório de checagens.
//
// Uso:
//   npm run curriculo              gera a versão base
//   npm run curriculo -- <slug>    gera a versão da vaga em vagas/<slug>/
//
// Decisões de ATS que moram aqui (detalhes em curriculo/README.md):
// coluna única, texto real (nada vira imagem), títulos de seção padrão,
// contato no corpo e não em cabeçalho de página, ligaduras desligadas para
// "fi" e "fl" não virarem um glifo só na extração, PDF marcado (tagged) com
// metadados de título, autor, assunto e palavras chave.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

// Playwright fica fora das dependências do site (é pesado e só serve aqui).
// require em vez de import para aceitar também uma instalação global via
// NODE_PATH. Na máquina local: npm install --no-save playwright e depois
// npx playwright install chromium.
const { chromium } = createRequire(import.meta.url)("playwright");

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");

/* ------------------------------------------------------------------ */
/* Entrada                                                             */
/* ------------------------------------------------------------------ */

const alvo = process.argv[2] ?? "base";
const ehBase = alvo === "base";
const caminhoDados = ehBase ? join(AQUI, "base.json") : join(AQUI, "vagas", alvo, "curriculo.json");
const pastaSaida = ehBase ? join(AQUI, "saida") : join(AQUI, "vagas", alvo);

if (!existsSync(caminhoDados)) {
  console.error(`Não achei ${relative(RAIZ, caminhoDados)}.`);
  process.exit(1);
}

const base = JSON.parse(readFileSync(join(AQUI, "base.json"), "utf8"));
const cv = JSON.parse(readFileSync(caminhoDados, "utf8"));
const lang = cv.idioma ?? "pt";

/* ------------------------------------------------------------------ */
/* Rótulos por idioma: títulos de seção que todo ATS reconhece          */
/* ------------------------------------------------------------------ */

const ROTULOS = {
  pt: {
    resumo: "Resumo profissional",
    competencias: "Competências",
    experiencia: "Experiência profissional",
    projetos: "Projetos",
    formacao: "Formação acadêmica",
    habilidades: "Habilidades técnicas",
    idiomas: "Idiomas",
    atual: "atual",
    a: "a",
    curriculo: "Currículo",
  },
  en: {
    resumo: "Professional summary",
    competencias: "Core skills",
    experiencia: "Work experience",
    projetos: "Projects",
    formacao: "Education",
    habilidades: "Technical skills",
    idiomas: "Languages",
    atual: "Present",
    a: "to",
    curriculo: "Resume",
  },
  es: {
    resumo: "Resumen profesional",
    competencias: "Competencias",
    experiencia: "Experiencia profesional",
    projetos: "Proyectos",
    formacao: "Formación académica",
    habilidades: "Habilidades técnicas",
    idiomas: "Idiomas",
    atual: "actual",
    a: "a",
    curriculo: "Currículum",
  },
};
const R = ROTULOS[lang] ?? ROTULOS.pt;

/* ------------------------------------------------------------------ */
/* Fontes do próprio site, embutidas em base64 (HTML autocontido)       */
/* ------------------------------------------------------------------ */

function fonte(familia, caminho, peso = "normal", estilo = "normal") {
  const dados = readFileSync(join(RAIZ, caminho)).toString("base64");
  return `@font-face{font-family:"${familia}";src:url(data:font/woff2;base64,${dados}) format("woff2");font-weight:${peso};font-style:${estilo};}`;
}

const FONTES = [
  fonte("Whyte Inktrap", "src/fonts/whyte-inktrap/WhyteInktrap-Black.woff2", 900),
  fonte("Whyte Inktrap", "src/fonts/whyte-inktrap/WhyteInktrap-Bold.woff2", 700),
  fonte("Switzer", "src/fonts/switzer/Switzer-Italic.woff2", 400, "italic"),
  // Archivo em instâncias estáticas: a versão variável sai como fonte Type 3
  // no PDF do Chromium, que parser de ATS antigo lê mal ou não lê.
  ...[400, 500, 600, 700].map((peso) =>
    fonte("Archivo", `node_modules/@fontsource/archivo/files/archivo-latin-${peso}-normal.woff2`, peso),
  ),
  fonte("IBM Plex Mono", "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", 500),
].join("\n");

/* ------------------------------------------------------------------ */
/* Montagem do HTML                                                    */
/* ------------------------------------------------------------------ */

// Junta itens com " · " usando espaço inseparável antes do ponto: a quebra de
// linha só acontece depois do separador, nunca uma linha começando em "·".
const juntar = (lista) => lista.join("\u00a0· ");

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// URL visível sem protocolo nem barra final: mais curta, e é o que o ATS lê.
const urlVisivel = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const periodo = (inicio, fim) => `${inicio} ${R.a} ${fim ?? R.atual}`;

const ORDEM_PADRAO = ["resumo", "competencias", "experiencia", "projetos", "formacao", "habilidades", "idiomas"];

function secao(id, titulo, corpo) {
  if (!corpo) return "";
  return `<section id="${id}"><h2>${esc(titulo)}</h2><div class="corpo">${corpo}</div></section>`;
}

function montarHtml() {
  const p = cv.pessoa;
  const contato = [
    esc(p.local),
    esc(p.telefone),
    `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`,
    ...p.links.map((l) => `<a href="${esc(l.url)}">${esc(urlVisivel(l.url))}</a>`),
  ]
    .filter(Boolean)
    .map((item) => `<span>${item}</span>`)
    .join(`<span class="sep">\u00a0· </span>`);

  const destaques = (cv.destaques ?? [])
    .map((d) => `<p class="destaque"><strong>${esc(d.valor)}</strong> <span>${esc(d.rotulo)}</span></p>`)
    .join("");

  const experiencia = (cv.experiencia ?? [])
    .map(
      (job) => `
      <article class="item">
        <div class="linha">
          <h3>${esc(job.cargo)}</h3>
          <span class="data">${esc(periodo(job.inicio, job.fim))}</span>
        </div>
        <p class="meta">${esc([job.empresa, job.local].filter(Boolean).join(" · "))}</p>
        ${job.descricao ? `<p class="descricao">${esc(job.descricao)}</p>` : ""}
        ${job.conquistas?.length ? `<ul>${job.conquistas.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
      </article>`,
    )
    .join("");

  const projetos = (cv.projetos ?? [])
    .map(
      (proj) => `
      <article class="item projeto">
        <div class="linha">
          <h3>${esc(proj.nome)}</h3>
          <span class="data">${esc(proj.contexto ?? "")}</span>
        </div>
        <p>${esc(proj.descricao)}</p>
        <p class="tec">${esc([...(proj.tecnologias ?? []), proj.url ? urlVisivel(proj.url) : ""].filter(Boolean).join("\u00a0· "))}</p>
      </article>`,
    )
    .join("");

  const formacao = (cv.formacao ?? [])
    .map(
      (f) => `
      <article class="item">
        <div class="linha">
          <h3>${esc(f.curso)}</h3>
          <span class="data">${esc(f.inicio ? periodo(f.inicio, f.fim) : (f.fim ?? ""))}</span>
        </div>
        <p class="meta">${esc(f.instituicao)}</p>
      </article>`,
    )
    .join("");

  const habilidades = (cv.habilidades ?? [])
    .map((g) => `<p class="grupo"><strong>${esc(g.grupo)}</strong> <span>${esc(juntar(g.itens))}</span></p>`)
    .join("");

  const idiomas = (cv.idiomas ?? [])
    .map((i) => `<p class="grupo"><strong>${esc(i.idioma)}</strong> <span>${esc(i.nivel)}</span></p>`)
    .join("");

  const ordem = cv.ordem ?? ORDEM_PADRAO;
  const blocos = {
    resumo: secao("resumo", R.resumo, cv.resumo && `<p class="resumo">${esc(cv.resumo)}</p>`),
    competencias: secao(
      "competencias",
      R.competencias,
      cv.competencias?.length && `<p class="competencias">${esc(juntar(cv.competencias))}</p>`,
    ),
    experiencia: secao("experiencia", R.experiencia, experiencia),
    projetos: secao("projetos", R.projetos, projetos),
    formacao: secao("formacao", R.formacao, formacao),
    habilidades: secao("habilidades", R.habilidades, habilidades),
    idiomas: secao("idiomas", R.idiomas, idiomas),
  };

  const titulo = `${p.nome} · ${R.curriculo} · ${cv.vaga?.cargo || p.titulo}`;

  return `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : lang}">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>
${FONTES}
@page { size: A4; margin: 12mm 14mm 12mm 14mm; }
:root {
  --tinta: #0b0b0b;
  --cinza: #5a5a5a;
  --fio: #0b0b0b;
  --fio-claro: #d6d6d6;
  /* Grade de duas colunas: rótulo da seção à esquerda, conteúdo à direita.
     A mesma lógica de "rótulo mono + bloco" dos cases do site. */
  --rotulo: 34mm;
  --vao: 6mm;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html {
  font-family: "Archivo", system-ui, sans-serif;
  font-size: 8.9pt;
  line-height: 1.38;
  color: var(--tinta);
  background: #ffffff;
  /* Sem ligaduras: "fi" e "fl" precisam sair como duas letras na extração
     de texto, senão "Profissional" vira "Pro?ssional" para o ATS. */
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "clig" 0, "dlig" 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
a { color: inherit; text-decoration: none; }
.mono { font-family: "IBM Plex Mono", monospace; }

/* ---------- Cabeçalho ---------- */
/* Respiro em cima do nome: a Whyte Inktrap desenha acima da própria
   métrica de ascendente, e o Chromium recorta tudo que passa da margem da
   página. Sem isso o topo das letras sai cortado no PDF. */
header { border-bottom: 2pt solid var(--fio); padding-top: 7pt; padding-bottom: 9pt; }
h1 {
  font-family: "Whyte Inktrap", "Archivo", sans-serif;
  font-weight: 900;
  font-size: 40pt;
  /* Entrelinha 1 e respiro em cima: com menos que isso a fonte passa da
     área útil da página e o Chromium corta o topo das letras no PDF. */
  line-height: 1;
  letter-spacing: -0.005em;
  text-transform: uppercase;
}
.titulo {
  font-family: "Switzer", "Archivo", sans-serif;
  font-style: italic;
  font-size: 14pt;
  line-height: 1.2;
  margin-top: 2pt;
}
.contato {
  font-family: "IBM Plex Mono", monospace;
  font-size: 7.3pt;
  line-height: 1.6;
  margin-top: 8pt;
  display: flex;
  flex-wrap: wrap;
  column-gap: 0;
}
.contato .sep { color: var(--cinza); white-space: pre; }

/* ---------- Números em destaque ---------- */
.destaques {
  /* 2x2 com número e rótulo na mesma linha de base: assim a extração de
     texto lê "20 mil+ acessos diários" junto, e não quatro números
     seguidos de quatro rótulos soltos. */
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 0.6pt solid var(--fio);
}
.destaque {
  display: flex;
  align-items: baseline;
  gap: 7pt;
  padding: 5pt 8pt 5pt 0;
  border-bottom: 0.6pt solid var(--fio-claro);
}
.destaque:nth-child(even) { border-left: 0.6pt solid var(--fio-claro); padding-left: 9pt; }
.destaque:nth-last-child(-n + 2) { border-bottom: 0; }
.destaque strong {
  font-family: "Whyte Inktrap", "Archivo", sans-serif;
  font-weight: 900;
  font-size: 18pt;
  line-height: 1.1;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.destaque span {
  font-family: "IBM Plex Mono", monospace;
  font-size: 6.8pt;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--cinza);
  white-space: nowrap;
}

/* ---------- Seções ---------- */
section {
  display: grid;
  grid-template-columns: var(--rotulo) 1fr;
  column-gap: var(--vao);
  padding: 7.5pt 0;
  border-bottom: 0.6pt solid var(--fio-claro);
}
section:last-child { border-bottom: 0; }
h2 {
  font-family: "IBM Plex Mono", monospace;
  font-weight: 500;
  font-size: 7.2pt;
  line-height: 1.35;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-top: 1.6pt;
  position: relative;
  padding-left: 9pt;
}
/* Quadrado preto antes do rótulo: o botão quadrado do site, sem virar
   caractere no texto extraído (é fundo, não glifo). */
h2::before {
  content: "";
  position: absolute;
  left: 0;
  top: 3.6pt;
  width: 4.4pt;
  height: 4.4pt;
  background: var(--tinta);
}
.corpo { min-width: 0; }
.resumo { font-size: 9.6pt; line-height: 1.42; }
.competencias { font-weight: 500; }

.item { padding-bottom: 5.5pt; margin-bottom: 5.5pt; border-bottom: 0.4pt dashed var(--fio-claro); break-inside: avoid; }
.item:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: 0; }
.linha { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
h3 {
  font-family: "Whyte Inktrap", "Archivo", sans-serif;
  font-weight: 700;
  font-size: 10.8pt;
  line-height: 1.25;
  letter-spacing: 0.005em;
}
.data {
  font-family: "IBM Plex Mono", monospace;
  font-size: 7.2pt;
  white-space: nowrap;
  color: var(--cinza);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.meta { font-weight: 600; margin-top: 0.5pt; }
.descricao { color: var(--cinza); margin-top: 1.5pt; }
ul { list-style: none; margin-top: 3.5pt; }
li { position: relative; padding-left: 10pt; margin-top: 1.2pt; }
li::before {
  content: "";
  position: absolute;
  left: 0.5pt;
  top: 4.3pt;
  width: 3pt;
  height: 3pt;
  background: var(--tinta);
}
.projeto p { margin-top: 1.5pt; }
.projeto .tec {
  font-family: "IBM Plex Mono", monospace;
  font-size: 6.9pt;
  color: var(--cinza);
  margin-top: 2.5pt;
}
.grupo { display: grid; grid-template-columns: 24mm 1fr; column-gap: 4mm; }
.grupo + .grupo { margin-top: 2.5pt; }
.grupo strong { font-weight: 700; }
</style>
</head>
<body>
<header>
  <h1>${esc(p.nome)}</h1>
  <p class="titulo">${esc(p.titulo)}</p>
  <p class="contato">${contato}</p>
</header>
${destaques ? `<div class="destaques">${destaques}</div>` : ""}
<main>
${ordem.map((k) => blocos[k] ?? "").join("\n")}
</main>
</body>
</html>`;
}


/* ------------------------------------------------------------------ */
/* Versão em texto puro: o que um ATS deveria enxergar                  */
/* ------------------------------------------------------------------ */

function montarTexto() {
  const p = cv.pessoa;
  const L = [];
  L.push(p.nome, p.titulo, [p.local, p.telefone, p.email].filter(Boolean).join(" · "));
  L.push(p.links.map((l) => `${l.rotulo}: ${l.url}`).join(" · "), "");
  if (cv.destaques?.length) L.push(cv.destaques.map((d) => `${d.valor} ${d.rotulo}`).join(" · "), "");
  const ordem = cv.ordem ?? ORDEM_PADRAO;
  for (const k of ordem) {
    if (k === "resumo" && cv.resumo) L.push(R.resumo.toUpperCase(), cv.resumo, "");
    if (k === "competencias" && cv.competencias?.length) L.push(R.competencias.toUpperCase(), cv.competencias.join(" · "), "");
    if (k === "experiencia" && cv.experiencia?.length) {
      L.push(R.experiencia.toUpperCase());
      for (const j of cv.experiencia) {
        L.push(`${j.cargo} · ${[j.empresa, j.local].filter(Boolean).join(", ")} · ${periodo(j.inicio, j.fim)}`);
        if (j.descricao) L.push(j.descricao);
        for (const c of j.conquistas ?? []) L.push(`· ${c}`);
        L.push("");
      }
    }
    if (k === "projetos" && cv.projetos?.length) {
      L.push(R.projetos.toUpperCase());
      for (const pr of cv.projetos) {
        L.push([pr.nome, pr.contexto, pr.url].filter(Boolean).join(" · "), pr.descricao);
        if (pr.tecnologias?.length) L.push(pr.tecnologias.join(" · "));
        L.push("");
      }
    }
    if (k === "formacao" && cv.formacao?.length) {
      L.push(R.formacao.toUpperCase());
      for (const f of cv.formacao) L.push(`${f.curso} · ${f.instituicao} · ${f.inicio ? periodo(f.inicio, f.fim) : (f.fim ?? "")}`);
      L.push("");
    }
    if (k === "habilidades" && cv.habilidades?.length) {
      L.push(R.habilidades.toUpperCase());
      for (const g of cv.habilidades) L.push(`${g.grupo}: ${g.itens.join(" · ")}`);
      L.push("");
    }
    if (k === "idiomas" && cv.idiomas?.length) {
      L.push(R.idiomas.toUpperCase(), cv.idiomas.map((i) => `${i.idioma} (${i.nivel})`).join(" · "), "");
    }
  }
  return L.join("\n").trim() + "\n";
}

/* ------------------------------------------------------------------ */
/* Checagens                                                           */
/* ------------------------------------------------------------------ */

const normalizar = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

// Todas as strings do JSON, exceto chaves de comentário e campos de controle.
function strings(obj, caminho = "") {
  if (typeof obj === "string") return [[caminho, obj]];
  if (Array.isArray(obj)) return obj.flatMap((v, i) => strings(v, `${caminho}[${i}]`));
  if (obj && typeof obj === "object")
    return Object.entries(obj)
      .filter(([k]) => !k.startsWith("$") && k !== "pendencias" && k !== "notas")
      .flatMap(([k, v]) => strings(v, caminho ? `${caminho}.${k}` : k));
  return [];
}

function checarCopy(erros, avisos) {
  const emoji = /\p{Extended_Pictographic}/u;
  for (const [onde, valor] of strings(cv)) {
    if (/url$|^pessoa\.email$|\.link$|^arquivo$/.test(onde)) continue;
    if (/[—–]/.test(valor)) erros.push(`Travessão ou meia risca em ${onde}: "${valor}"`);
    if (/_/.test(valor)) erros.push(`Sublinhado em ${onde}: "${valor}"`);
    if (/\s-\s/.test(valor)) erros.push(`Hífen usado como pausa em ${onde}: "${valor}"`);
    if (/\p{L}-\p{L}/u.test(valor)) avisos.push(`Hífen entre palavras em ${onde}: "${valor}" (prefira "front end", "alta fidelidade")`);
    if (emoji.test(valor)) erros.push(`Emoji em ${onde}: "${valor}"`);
  }
}

// Todo número de uma versão adaptada precisa existir no base.json: é a trava
// contra métrica inventada na hora de adaptar para a vaga.
function checarNumeros(erros) {
  if (ehBase) return;
  const textoBase = strings(base)
    .map(([, v]) => v)
    .join(" ");
  const numerosBase = new Set(textoBase.match(/\d+(?:[.,]\d+)?/g) ?? []);
  for (const [onde, valor] of strings(cv)) {
    if (/url$|telefone$|^vaga\./.test(onde)) continue;
    for (const n of valor.match(/\d+(?:[.,]\d+)?/g) ?? []) {
      if (!numerosBase.has(n)) erros.push(`Número sem lastro no base.json em ${onde}: "${n}"`);
    }
  }
}

function checarExtracao(textoPdf, erros, avisos) {
  const t = normalizar(textoPdf);
  for (const essencial of [cv.pessoa.nome, cv.pessoa.email]) {
    if (!t.includes(normalizar(essencial))) erros.push(`O texto extraído do PDF não contém "${essencial}".`);
  }
  if (/[ﬀ-ﬆ]/.test(textoPdf)) erros.push("O PDF tem ligaduras (ﬁ, ﬂ) no texto extraído.");
  // Ordem de leitura: os títulos de seção precisam sair na ordem do layout.
  const titulos = [...textoPdf.matchAll(/^.*$/gm)].map((m) => m[0].trim()).filter(Boolean);
  const esperados = Object.entries(R)
    .filter(([k]) => ["resumo", "competencias", "experiencia", "projetos", "formacao", "habilidades", "idiomas"].includes(k))
    .map(([, v]) => normalizar(v));
  const achados = titulos.map(normalizar).filter((l) => esperados.includes(l));
  const ordemEsperada = (cv.ordem ?? ORDEM_PADRAO)
    .map((k) => normalizar(R[k]))
    .filter((v) => achados.includes(v));
  if (achados.join("|") !== ordemEsperada.join("|"))
    avisos.push(`Ordem de leitura das seções no PDF difere do layout: ${achados.join(", ")}`);
}

function checarPalavras(textoPdf) {
  const t = normalizar(textoPdf);
  const lista = cv.vaga?.palavrasChave ?? [];
  return lista.map((termo) => {
    const alternativas = String(termo).split("|").map((s) => s.trim());
    const hits = alternativas.map((a) => {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${normalizar(a).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu");
      return (t.match(re) ?? []).length;
    });
    return { termo, vezes: hits.reduce((a, b) => a + b, 0) };
  });
}

/* ------------------------------------------------------------------ */
/* Execução                                                            */
/* ------------------------------------------------------------------ */

mkdirSync(pastaSaida, { recursive: true });
const nomeArquivo = cv.arquivo || `${cv.pessoa.nome.replace(/\s+/g, "-")}-Curriculo`;
const caminhoPdf = join(pastaSaida, `${nomeArquivo}.pdf`);
const caminhoTxt = join(pastaSaida, `${nomeArquivo}.txt`);
// Prévia rasterizada do próprio PDF (não de um screenshot da tela): é o
// único jeito de ver corte, quebra de página e fonte exatamente como saem.
const prefixoPrevia = join(pastaSaida, "previa");
const caminhoRel = join(pastaSaida, "relatorio.md");

const erros = [];
const avisos = [];
checarCopy(erros, avisos);
checarNumeros(erros);

const html = montarHtml();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
// A faixa de destaques é só desenho: os mesmos números já estão, com
// contexto, no resumo e nas conquistas. Em texto, número grande e rótulo
// pequeno saem em blocos separados na extração ("20 mil+ 8%+" soltos), então
// cada célula é redesenhada num canvas em alta resolução e o texto original
// deixa de ser pintado. O ATS lê o número uma vez só, no lugar certo.
await page.evaluate(() => {
  const escala = 6;
  for (const celula of document.querySelectorAll(".destaque")) {
    const caixa = celula.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(caixa.width * escala);
    canvas.height = Math.ceil(caixa.height * escala);
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "absolute", left: "0", top: "0", width: `${caixa.width}px`, height: `${caixa.height}px` });
    const ctx = canvas.getContext("2d");
    ctx.scale(escala, escala);
    for (const el of celula.children) {
      const cs = getComputedStyle(el);
      // Sonda de altura zero no fim do texto: o fundo dela é a linha de base.
      const sonda = document.createElement("i");
      sonda.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
      el.appendChild(sonda);
      const base = sonda.getBoundingClientRect().bottom - caixa.top;
      sonda.remove();
      const r = el.getBoundingClientRect();
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      ctx.fillStyle = cs.color;
      ctx.textBaseline = "alphabetic";
      const texto = cs.textTransform === "uppercase" ? el.textContent.toLocaleUpperCase("pt-BR") : el.textContent;
      ctx.fillText(texto, r.left - caixa.left, base);
      el.style.visibility = "hidden";
    }
    celula.style.position = "relative";
    celula.appendChild(canvas);
  }
});
await page.emulateMedia({ media: "print" });
await page.pdf({ path: caminhoPdf, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
await browser.close();

// Metadados do PDF: título, autor, assunto e palavras chave. Alguns ATS e
// buscadores leem esses campos antes do corpo.
const doc = await PDFDocument.load(readFileSync(caminhoPdf));
const cargo = cv.vaga?.cargo || cv.pessoa.titulo;
doc.setTitle(`${cv.pessoa.nome} · ${R.curriculo} · ${cargo}`, { showInWindowTitleBar: true });
doc.setAuthor(cv.pessoa.nome);
doc.setSubject([cargo, cv.vaga?.empresa].filter(Boolean).join(" · "));
doc.setKeywords([
  [...new Set([...(cv.vaga?.palavrasChave ?? []).map((k) => String(k).split("|")[0].trim()), ...(cv.competencias ?? [])])].join(", "),
]);
doc.setCreator(cv.pessoa.nome);
doc.setProducer(cv.pessoa.nome);
doc.setLanguage(lang === "pt" ? "pt-BR" : lang);
writeFileSync(caminhoPdf, await doc.save({ useObjectStreams: false }));
const paginas = doc.getPageCount();

writeFileSync(caminhoTxt, montarTexto());

for (const f of readdirSync(pastaSaida)) if (/^previa(-\d+)?\.png$/.test(f)) rmSync(join(pastaSaida, f));
try {
  execFileSync("pdftoppm", ["-r", "130", "-png", caminhoPdf, prefixoPrevia]);
} catch {
  avisos.push("pdftoppm não encontrado: sem prévia em PNG.");
}

// Extração com pdftotext (poppler), o mesmo tipo de leitura que um ATS faz.
let textoPdf = "";
let fontes = "";
try {
  textoPdf = execFileSync("pdftotext", ["-enc", "UTF-8", caminhoPdf, "-"], { encoding: "utf8" });
  fontes = execFileSync("pdffonts", [caminhoPdf], { encoding: "utf8" });
  checarExtracao(textoPdf, erros, avisos);
} catch {
  avisos.push("pdftotext não encontrado: a checagem de extração usou o texto gerado, não o PDF.");
  textoPdf = montarTexto();
}
if (/Type 3/.test(fontes)) avisos.push("Há fonte Type 3 no PDF, alguns parsers antigos leem mal.");

if (paginas > 2) avisos.push(`O PDF tem ${paginas} páginas. Para ATS e recrutador, o ideal é 1 ou 2.`);

const palavras = checarPalavras(textoPdf);
const faltando = palavras.filter((p) => p.vezes === 0);
const cobertura = palavras.length ? Math.round(((palavras.length - faltando.length) / palavras.length) * 100) : null;

const pendencias = [...(ehBase ? base.pendencias ?? [] : []), ...(cv.pendencias ?? [])];
const rel = [
  `# Relatório · ${nomeArquivo}`,
  "",
  `Páginas: ${paginas}  `,
  `Cobertura de palavras chave da vaga: ${cobertura === null ? "sem lista em vaga.palavrasChave" : `${cobertura}%`}`,
  "",
  "## Erros",
  erros.length ? erros.map((e) => `* ${e}`).join("\n") : "Nenhum.",
  "",
  "## Avisos",
  avisos.length ? avisos.map((e) => `* ${e}`).join("\n") : "Nenhum.",
  "",
  ...(palavras.length
    ? ["## Palavras chave", "", "| Termo | Vezes no PDF |", "| :--- | ---: |", ...palavras.map((p) => `| ${p.termo} | ${p.vezes} |`), ""]
    : []),
  ...(pendencias.length ? ["## Pendências de dado", pendencias.map((p) => `* ${p}`).join("\n"), ""] : []),
  "## Texto extraído do PDF (o que o ATS lê)",
  "",
  "```text",
  textoPdf.trim(),
  "```",
  "",
].join("\n");
writeFileSync(caminhoRel, rel);

console.log(`PDF      ${relative(RAIZ, caminhoPdf)} (${paginas} página${paginas > 1 ? "s" : ""})`);
console.log(`Texto    ${relative(RAIZ, caminhoTxt)}`);
console.log(`Prévia   ${relative(RAIZ, prefixoPrevia)}-N.png`);
console.log(`Relatório ${relative(RAIZ, caminhoRel)}`);
if (cobertura !== null) console.log(`Cobertura ${cobertura}%${faltando.length ? ` (faltam: ${faltando.map((f) => f.termo).join(", ")})` : ""}`);
for (const e of erros) console.log(`ERRO  ${e}`);
for (const a of avisos) console.log(`AVISO ${a}`);
if (erros.length) process.exit(1);
