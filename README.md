# Portfólio de Armando Custodio

Design Engineer. Experiências interativas do banking à música.

Duas experiências no mesmo conteúdo: a criativa, com textura, movimento e som, e o
Modo Boring, uma página utilitária em preto e branco que também é o currículo
imprimível.

## Rodando

```bash
npm install
npm run dev     # http://localhost:3000/pt/
npm run build   # gera o site estático em out/
```

## Onde mexer

| Quero mudar                  | Vou em                                        |
| ---------------------------- | --------------------------------------------- |
| Textos do site               | `src/i18n/dictionaries/pt.ts` (e en, es)       |
| Cases e métricas             | `src/data/cases.ts`                            |
| Vídeos e fotos placeholder   | `src/data/cases.ts` e `src/data/experiments.ts` |
| Contato, habilidades, cargo  | `src/data/profile.ts`                          |
| Cores, fontes, texturas      | `src/app/globals.css`                          |

## Antes de escrever qualquer texto

Leia `docs/tom-de-voz.md`. Regra número um: nada de travessão nem sublinhado.

Arquitetura e decisões técnicas em `docs/architecture.md`.

## Publicação

Push na `main` publica sozinho no GitHub Pages, via GitHub Actions.

O workflow tenta habilitar o Pages sozinho na primeira execução. Se o job de
publicação falhar em poucos segundos, sem executar nenhum passo, é sinal de que o
Pages continua desligado: habilite em Settings, Pages, Source igual a GitHub
Actions, e rode o workflow de novo.
