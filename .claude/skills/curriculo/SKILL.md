---
name: curriculo
description: Adapta o currículo do Armando para uma vaga específica, otimizando para ATS, triagem por IA de RH e busca de recrutador. Use quando o usuário colar uma vaga (texto ou link), pedir "currículo para esta vaga", ou pedir para ajustar, traduzir ou regenerar o currículo.
---

# Currículo por vaga

Leia `curriculo/README.md` antes de começar. Toda comunicação em português do
Brasil e a regra de copy do projeto vale no currículo: nada de travessão, meia
risca, hífen como pausa, sublinhado ou emoji em texto visível.

## Regra que não se quebra

**Nunca invente.** Todo fato, ferramenta, número e cargo vem de
`curriculo/base.json` ou do que o usuário disser na conversa. Pode reordenar,
cortar, reescrever e trocar sinônimo pelo termo exato da vaga. Não pode
acrescentar tecnologia que ele não usou, métrica que não existe ou
senioridade que ele não tem. Se a vaga pede algo que não está no base, isso é
lacuna: pergunte ao usuário. Se ele confirmar com um fato novo, grave primeiro
no `base.json` (o gerador recusa número sem lastro lá) e depois use.

## Passos

1. **Vaga.** Se veio link, busque o texto. Crie `curriculo/vagas/<empresa-cargo>/`
   (slug minúsculo com hífen) e salve o anúncio integral em `vaga.md`, com
   empresa, cargo, link e data no topo.

2. **Análise** em `analise.md`:
   * cargo exato do anúncio e idioma da vaga;
   * requisitos obrigatórios e desejáveis, separados;
   * palavras chave: hard skills, ferramentas, metodologias, domínio do
     negócio, soft skills, na grafia do anúncio;
   * para cada requisito: evidência no `base.json` (qual bullet ou projeto),
     ou LACUNA;
   * ATS provável (Gupy, Workday, Greenhouse, Lever, LinkedIn) se der para
     inferir pelo link.

   Mostre ao usuário as lacunas e pergunte o que for decisivo antes de seguir.

3. **Adaptação** em `curriculo.json` (copie o `base.json` e ajuste):
   * `idioma` igual ao da vaga (pt, en, es); traduza tudo se preciso;
   * `arquivo`: `Armando-Custodio-Curriculo-<Cargo-Da-Vaga>`;
   * `vaga`: empresa, cargo, link e `palavrasChave` (as da análise; variantes
     com `|`);
   * `pessoa.titulo`: cargo do anúncio na frente, se for verdadeiro;
   * `resumo`: 3 a 4 frases, cargo da vaga, os requisitos obrigatórios que ele
     cumpre e 1 ou 2 números reais;
   * `competencias`: 8 a 14 termos, os da vaga primeiro, grafia do anúncio;
   * `experiencia`: reordene e reescreva bullets para trazer os termos da vaga
     em contexto de resultado; corte o que não ajuda; mantenha cargos, empresas
     e datas fiéis;
   * `destaques`: os 4 números do base que mais pesam para a vaga (precisam
     estar também no resumo ou nas conquistas, a faixa não é lida pelo ATS);
   * `projetos`: só os que reforçam a vaga (2 a 4), AUVP primeiro quando a
     vaga for de produto, pessoais quando for criativa ou interativa;
   * `banco` (no base.json) guarda conquistas e projetos verdadeiros que não
     saem no PDF base: puxe dali o que servir melhor à vaga e remova o bloco
     `banco` da versão adaptada;
   * `habilidades`: reordene, tire o irrelevante;
   * `ordem`: se a vaga é muito técnica e a experiência fala mais, experiência
     pode subir antes de competências;
   * remova `pendencias` e `$comentario` do base; acrescente `pendencias`
     próprias da vaga, se houver.

4. **Checar (gerador local):** `npm run curriculo -- <slug>`. Serve de
   verificação de ATS: erro bloqueia (copy, número sem lastro, texto que não
   extrai) e o `relatorio.md` mede as palavras chave no texto extraído.
   * Cobertura: mire 80% ou mais dos termos obrigatórios. Termo faltando que
     ele de fato domina: encaixe num bullet. Lacuna real: fica de fora e vai
     para a análise.
   * Termo repetido demais (mais de 4 ou 5 vezes) soa como enchimento para
     leitor com IA: reduza.

5. **Montar no Claude Design** (é ali que o Armando ajusta e exporta o PDF):
   canvas "Currículo Armando Custodio",
   https://claude.ai/artifact/AsRx7mAvK113ZCJgzKSEAz. Leia o
   `project/canvas.json` e as pranchetas da versão base (`Main.dc.html` e
   `Pagina-2.dc.html`) e copie a estrutura: mesmas fontes enviadas, mesma
   grade (rótulo de 121px, vão de 30px), mesmos estilos. Cada vaga ganha uma
   página nova do canvas (`pages`, id = slug) com duas pranchetas A4 de
   794×1123 (`vagas/<slug>-1.dc.html` e `-2.dc.html`), numa linha nova
   abaixo das existentes, sem cobrir nenhuma.
   * **Equilíbrio entre páginas:** as duas folhas precisam terminar perto da
     mesma altura, nenhuma cheia com a outra vazia. Meça a altura do conteúdo
     de cada prancheta antes de publicar e redistribua seções (projetos,
     habilidades, experiência anterior) até ficarem parecidas e dentro da
     margem de 45px.
   * Programas da AUVP sempre pela definição (Sistema de Indicação AUVP,
     curso de investimentos, portal interno de produto), nunca pelo nome
     de marca interno.

6. **Entregar:** resumo curto com cobertura, lacunas, o que mudou em relação
   ao base e o link do canvas. Sugira ajustes no LinkedIn quando o
   vocabulário da vaga não aparece lá. Commit com mensagem em português.
