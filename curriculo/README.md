# Gerador de currículo

Currículo com a estética do portfólio (preto no branco, Whyte Inktrap no nome,
Switzer itálico no título, Archivo no corpo, IBM Plex Mono nos rótulos), feito
para ser lido primeiro por máquina (ATS, triagem por IA, busca de recrutador) e
depois por gente.

## Estrutura

```
curriculo/
  base.json                 fonte da verdade: tudo que é fato sobre mim
  gerar.mjs                 JSON para PDF, TXT, prévia e relatório
  saida/                    versão base gerada
  vagas/<empresa-cargo>/
    vaga.md                 texto integral da vaga, colado como veio
    curriculo.json          versão adaptada (mesmo formato do base.json)
    analise.md              palavras chave, lacunas, decisões da adaptação
    <Arquivo>.pdf           o que eu envio
    <Arquivo>.txt           para colar em formulário (Gupy, LinkedIn, Workday)
    previa-N.png            cada página do PDF rasterizada, para conferir
    relatorio.md            checagens e o texto como o ATS lê
```

## Uso

```bash
npm run curriculo
```

```bash
npm run curriculo -- nubank-product-designer
```

No Claude Code: `/curriculo` e cole a vaga (texto ou link). A skill em
`.claude/skills/curriculo/SKILL.md` conduz o processo inteiro.

Na máquina local o Playwright não vem nas dependências do site:

```bash
npm install --no-save playwright && npx playwright install chromium
```

## O que o gerador garante

* **Ordem de leitura linear.** O rótulo de cada seção fica numa coluna estreita
  à esquerda, mas o conteúdo é uma coluna só; o relatório confere que as
  seções saem do PDF na ordem certa.
* **Texto real com fontes TrueType embutidas.** A Archivo variável sai como
  Type 3 no Chromium, então o gerador usa as instâncias estáticas.
* **Ligaduras desligadas.** "fi" e "fl" viram glifo único e quebram palavras
  como "profissional" na extração.
* **Contato no corpo da página**, não em cabeçalho ou rodapé (muitos ATS
  ignoram essas áreas). URLs escritas por extenso, porque o ATS lê o texto e
  não o link.
* **Títulos de seção padrão** ("Experiência profissional", "Formação
  acadêmica"): é por eles que o parser separa os blocos.
* **PDF marcado (tagged)** com idioma, título, autor, assunto e palavras chave
  nos metadados.
* **Copy do site:** nada de travessão, meia risca, sublinhado ou emoji. Hífen
  entre palavras gera aviso.
* **Trava contra invenção:** numa versão de vaga, todo número precisa existir
  no `base.json`, senão o gerador falha.
* **Relatório** com cobertura de palavras chave contada no texto extraído do
  PDF (não no JSON), número de páginas e o texto exato que o ATS recebe.

## Como figurar bem em ATS e triagem por IA

1. **Cargo da vaga no título**, escrito igual ao anúncio, quando for verdade
   ("Product Designer Sênior" e não só "Designer").
2. **Termos exatos do anúncio**, na grafia do anúncio. Sigla e forma longa
   juntas na primeira vez: "Otimização de conversão (CRO)".
3. **Palavra chave em contexto**, dentro de uma conquista com resultado. IA de
   triagem (Gupy, LinkedIn, Workday, leitores com LLM) pontua evidência, não
   lista solta. A seção de competências é reforço, não substituto.
4. **Requisitos obrigatórios cobertos primeiro**, nos três primeiros bullets
   da experiência mais recente e no resumo.
5. **Datas consistentes** (ano, idealmente mês e ano). Os ATS calculam tempo
   de experiência a partir delas.
6. **Uma ou duas páginas.** Mais que isso dilui a relevância.
7. **Nome do arquivo descritivo:** `Armando-Custodio-Curriculo-<Cargo>.pdf`.
8. **Idioma da vaga.** Vaga em inglês recebe currículo em inglês
   (`"idioma": "en"` troca os títulos de seção).
9. **Sem enfeite que esconda texto:** nada de ícone no lugar de palavra, barra
   de nível de habilidade ou texto dentro de imagem.
10. **Coerência com LinkedIn e portfólio.** Recrutador e IA cruzam fontes;
    cargo, datas e empresas precisam bater.

Para busca (LinkedIn Recruiter, bancos de talentos da Gupy, buscadores com IA),
vale o mesmo vocabulário no título do LinkedIn, no "Sobre" e no portfólio.

## Formato do JSON

Igual ao `base.json`. Dois campos merecem nota:

* `destaques`: até quatro números grandes no topo (valor e rótulo). A faixa é
  só visual: o gerador a desenha como imagem, então ela não entra no texto que
  o ATS lê. Todo número dali precisa aparecer também, com contexto, no resumo
  ou nas conquistas.
* `projetos[].contexto`: onde o projeto aconteceu ("AUVP · 2026", "Projeto
  pessoal", "Freelance").

Campos extras opcionais numa versão de vaga:

* `vaga.palavrasChave`: lista de termos medidos no relatório. Use `|` para
  variantes equivalentes: `"Frontend|Front end"`.
* `ordem`: ordem das seções, por exemplo `["resumo", "experiencia",
  "competencias", "projetos", "formacao", "habilidades", "idiomas"]`.
* `pendencias`: lembretes que aparecem no relatório.
