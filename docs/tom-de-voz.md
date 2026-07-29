# Tom de voz e regras de copy

Documento normativo. Vale para todo texto visível do site (dicionários de i18n,
dados de cases, títulos, legendas, metadados) e também para commits, PRs e docs.

## Regra número um: nada de travessão nem sublinhado

**Proibido nos textos:** travessão (—), meia risca (–), hífen usado como pausa (,)
e sublinhado (\_).

Esses sinais são a assinatura mais óbvia de texto gerado por máquina. Em vez deles:

| Em vez de                       | Escreva                            |
| ------------------------------- | ---------------------------------- |
| `design, e código, na mesma pessoa` | `design e código na mesma pessoa` |
| `Métricas ilustrativas, números finais em consolidação` | `Métricas ilustrativas, números finais em consolidação` |
| `2024–2026`                     | `2024/2026`                        |
| `alta-fidelidade`               | `alta fidelidade`                  |
| `E-mail`                        | `Email`                            |

Para pausar a frase: vírgula, ponto, dois pontos ou parênteses. Para separar itens
em linha: bullet (·), que já faz parte da identidade visual.

**Exceção técnica:** hífen e sublinhado continuam válidos onde são sintaxe e não
texto, ou seja, slugs de URL (`guia-da-musica-2026`), nomes de arquivo, chaves de
localStorage, classes CSS e propriedades de código. O que a pessoa lê na tela é que
precisa estar limpo.

## Tom

Conversa de gente, não release corporativo. Primeira pessoa, frase curta, verbo
forte. O trabalho fala por resultado, não por adjetivo.

- **Sim:** "Construí uma intranet com Design System completo para todo o ecossistema."
- **Não:** "Solução inovadora que revoluciona a experiência do usuário."

Evitar: "elevar", "potencializar", "jornada", "solução robusta", "paixão por",
"do zero ao um", qualquer superlativo vazio e qualquer frase que caberia igual no
portfólio de outra pessoa.

## Cases

Cada case é anunciado como um resultado em primeira pessoa. Começa com o verbo do
que foi feito, termina no efeito que aquilo teve. Números grandes na capa, sem
enfeite. Enquanto o número real não estiver calibrado, fica o placeholder explícito
(`+XX%`) com o aviso de métrica ilustrativa, nunca um número inventado que pareça real.

## Idiomas

PT BR é a fonte da verdade. Inglês e espanhol traduzem a intenção, não a estrutura
da frase. Todas as regras acima valem igual nos três.
