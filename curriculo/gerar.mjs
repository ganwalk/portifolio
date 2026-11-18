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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// URL visível sem protocolo nem barra final: mais curta, e é o que o ATS lê.
const urlVisivel = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const periodo = (inicio, fim) => `${inicio} ${R.a} ${fim ?? R.atual}`;

function secao(id, titulo, corpo) {
  if (!corpo) return "";
  return `<section id="${id}"><h2>${esc(titulo)}</h2>${corpo}</section>`;
}

function montarHtml() {
  const p = cv.pessoa;
  const contato = [
    p.local,
    p.telefone,
    `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`,
    ...p.links.map((l) => `<a href="${esc(l.url)}">${esc(urlVisivel(l.url))}</a>`),
  ]
    .filter(Boolean)
    .map((item) => (item.startsWith("<a") ? item : esc(item)))
    .join(" · ");

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
          ${proj.url ? `<a class="data" href="${esc(proj.url)}">${esc(urlVisivel(proj.url))}</a>` : ""}
        </div>
        <p>${esc(proj.descricao)}${proj.tecnologias?.length ? ` <span class="tec">${esc(proj.tecnologias.join(" · "))}</span>` : ""}</p>
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
    .map((g) => `<p class="grupo"><strong>${esc(g.grupo)}:</strong> ${esc(g.itens.join(" · "))}</p>`)
    .join("");

  const idiomas = (cv.idiomas ?? []).map((i) => `${esc(i.idioma)} (${esc(i.nivel)})`).join(" · ");

  const ordem = cv.ordem ?? ["resumo", "competencias", "experiencia", "projetos", "formacao", "habilidades", "idiomas"];
  const blocos = {
    resumo: secao("resumo", R.resumo, cv.resumo && `<p>${esc(cv.resumo)}</p>`),
    competencias: secao(
      "competencias",
      R.competencias,
      cv.competencias?.length && `<p class="competencias">${esc(cv.competencias.join(" · "))}</p>`,
    ),
    experiencia: secao("experiencia", R.experiencia, experiencia),
    projetos: secao("projetos", R.projetos, projetos),
    formacao: secao("formacao", R.formacao, formacao),
    habilidades: secao("habilidades", R.habilidades, habilidades),
    idiomas: secao("idiomas", R.idiomas, idiomas && `<p>${idiomas}</p>`),
  };

  const titulo = `${p.nome} · ${R.curriculo} · ${cv.vaga?.cargo || p.titulo}`;

  return `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : lang}">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta name="author" content="${esc(p.nome)}">
<style>
${FONTES}
@page { size: A4; margin: 14mm 16mm 14mm 16mm; }
:root { --tinta: #0b0b0b; --cinza: #555555; --linha: #0b0b0b; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html {
  font-family: "Archivo", system-ui, sans-serif;
  font-size: 9.4pt;
  line-height: 1.42;
  color: var(--tinta);
  background: #ffffff;
  /* Sem ligaduras: "fi" e "fl" precisam sair como duas letras na extração
     de texto, senão "Profissional" vira "Pro?ssional" para o ATS. */
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "clig" 0, "dlig" 0;
  -webkit-print-color-adjust: exact;
}
a { color: inherit; text-decoration: none; }

header { padding-bottom: 10pt; border-bottom: 1.5pt solid var(--linha); margin-bottom: 11pt; }
h1 {
  font-family: "Whyte Inktrap", "Archivo", sans-serif;
  font-weight: 900;
  font-size: 34pt;
  line-height: 0.86;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}
.titulo {
  font-family: "Switzer", "Archivo", sans-serif;
  font-style: italic;
  font-size: 13pt;
  margin-top: 6pt;
}
.contato {
  font-family: "IBM Plex Mono", monospace;
  font-size: 7.6pt;
  line-height: 1.55;
  margin-top: 7pt;
  color: var(--tinta);
}

section { margin-top: 11pt; }
h2 {
  font-family: "IBM Plex Mono", monospace;
  font-weight: 500;
  font-size: 7.6pt;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-bottom: 3pt;
  margin-bottom: 6pt;
  border-bottom: 0.6pt solid var(--linha);
  break-after: avoid;
}
.item { margin-bottom: 8pt; break-inside: avoid; }
.item:last-child { margin-bottom: 0; }
.linha { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; }
h3 { font-size: 10.4pt; font-weight: 700; letter-spacing: -0.005em; }
.data {
  font-family: "IBM Plex Mono", monospace;
  font-size: 7.6pt;
  white-space: nowrap;
  color: var(--cinza);
}
.meta { font-weight: 600; }
.descricao { color: var(--cinza); margin-top: 1pt; }
ul { list-style: none; margin-top: 3pt; }
li { position: relative; padding-left: 10pt; margin-top: 1.5pt; }
li::before { content: "·"; position: absolute; left: 2pt; font-weight: 700; }
.projeto p { margin-top: 1pt; }
.tec { font-family: "IBM Plex Mono", monospace; font-size: 7.4pt; color: var(--cinza); white-space: nowrap; }
.competencias { font-weight: 500; }
.grupo + .grupo { margin-top: 2pt; }
.grupo strong { font-weight: 700; }
</style>
</head>
<body>
<header>
  <h1>${esc(p.nome)}</h1>
  <p class="titulo">${esc(p.titulo)}</p>
  <p class="contato">${contato}</p>
</header>
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
  const ordem = cv.ordem ?? ["resumo", "competencias", "experiencia", "projetos", "formacao", "habilidades", "idiomas"];
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
        L.push(`${pr.nome}${pr.url ? ` · ${pr.url}` : ""}`, pr.descricao);
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
  const ordemEsperada = (cv.ordem ?? ["resumo", "competencias", "experiencia", "projetos", "formacao", "habilidades", "idiomas"])
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
const caminhoPng = join(pastaSaida, "previa.png");
const caminhoRel = join(pastaSaida, "relatorio.md");

const erros = [];
const avisos = [];
checarCopy(erros, avisos);
checarNumeros(erros);

const html = montarHtml();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: "print" });
await page.pdf({ path: caminhoPdf, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
await page.emulateMedia({ media: "screen" });
await page.addStyleTag({ content: "body{padding:14mm 16mm;width:210mm}" });
await page.screenshot({ path: caminhoPng, fullPage: true });
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
console.log(`Prévia   ${relative(RAIZ, caminhoPng)}`);
console.log(`Relatório ${relative(RAIZ, caminhoRel)}`);
if (cobertura !== null) console.log(`Cobertura ${cobertura}%${faltando.length ? ` (faltam: ${faltando.map((f) => f.termo).join(", ")})` : ""}`);
for (const e of erros) console.log(`ERRO  ${e}`);
for (const a of avisos) console.log(`AVISO ${a}`);
if (erros.length) process.exit(1);
