---
artifact-kind: research
---

# Direcao — Prova de valor incremental

- **Data:** 2026-06-23
- **Spec:** 0024 — context-architecture
- **Checkpoint ativo:** `artifact-taxonomy-and-model-review-contract` (PR #45)
- **Natureza:** research/direction, investigacao R2
- **Origem:** rodada Claude Code sobre prova de valor incremental
- **Autoridade:** nao-operacional. Em divergencia, vencem `state.yml`,
  `tasks.md`, `decision-brief.md`, reviews/gates, Git e GitHub.
- **Status:** insumo para possivel DEC pequena/aditiva; nao e DEC.

## 1. Por que este artefato existe

Apos `[DEC-0024-G23]`, a lacuna mais nova e defensavel passou a ser a ausencia
de um contrato explicito para valor incremental. A dor observada:

- checkpoints grandes acumulam trabalho antes de provar valor;
- checks podem provar output ou readiness sem provar outcome;
- dogfood manual descobre tarde quando uma entrega nao gerou valor verificavel.

Esta pesquisa preserva a investigacao R2: como definir "valor entregue" como
disciplina de planejamento, sem criar um `value engine`, sem adicionar campo ao
runtime agora e sem reabrir decisoes fundacionais.

## 2. Achado central

O conceito "Valor entregue" ja existe na Spec 0024 como linguagem de mapa visual
e resumo retrospectivo. O problema nao e falta de palavra; e o tempo em que ela
aparece.

Hipotese R2:

> Nao precisamos inventar valor. Precisamos virar o tempo: tornar "Valor
> entregue" prospectivo, falsificavel e por etapa, usando o slot ja existente de
> criterio de saida.

Assim, prova de valor nasce como lente/disciplina, nao como entidade nova.

## 3. Distincoes minimas

### Output

Um artefato existe.

Exemplo: arquivo criado, `kind` presente, schema escrito, comando adicionado.

### Readiness

O checklist governado esta completo o suficiente para declarar readiness.

Exemplo: `mark-readiness` aplicavel, etapa entregue, reviews/checks em ordem.

### Valor

Alguem passa a poder fazer, confiar, revisar ou ser impedido de algo verificavel
que antes nao podia.

Exemplo: uma ambiguidade real de autoridade deixa de existir; uma classe de erro
passa a falhar mecanicamente; uma jornada real fica falsificavel.

Resumo:

> Output nao implica readiness. Readiness nao implica valor. Valor precisa de uma
> testemunha concreta.

## 4. Conceito minimo de valor entregue

Em um framework de governanca, um incremento entrega valor quando move ao menos
uma destas dimensoes de falso para verdadeiro:

- **capacidade:** uma acao ou resposta governada nova e possivel;
- **garantia:** uma classe de erro agora falha mecanicamente;
- **legibilidade:** um humano entende, navega ou revisa algo que antes era
  opaco;
- **honestidade:** uma projecao prova bater com a SSOT ou declara sua fronteira.

Essas quatro dimensoes sao lente de leitura. Nao sao taxonomia nova, nao
substituem `kind` e nao definem nos de grafo agora.

## 5. Contrato proposto de `value-claim`

Menor forma util:

```text
Valor entregue: depois de <etapa>, <beneficiario> pode <capacidade/garantia
observavel> — o que antes <estado anterior falsificavel>.
```

Regras:

- exatamente um `value-claim` por etapa;
- deve ser falsificavel;
- deve ser independentemente entregavel;
- deve caber antes da proxima etapa com valor proprio;
- lista de claims para uma mesma etapa e sinal de checkpoint grande demais;
- ausencia de claim falsificavel e sinal de prova minima falsa ou etapa mal
  fatiada.

## 6. Contrato proposto de prova de valor

Menor forma util:

```text
Aceite de valor: <testemunha concreta> exercita a capacidade ponta-a-ponta; sem
ela, a etapa nao entregou valor mesmo com checklist 100%. <O que refutaria>.
```

Testemunhas validas:

- saida de comando real;
- check que falha na violacao e passa limpo;
- jornada/fixture que exercita entrypoint real;
- demo executavel por humano;
- diff de artefato revisavel que resolve ambiguidade real;
- revisao/gate que confirma boundary agregado.

Nao conta:

- check interno sem cenario real;
- arquivo criado sem ambiguidade resolvida;
- refactor que so move arquivos;
- readiness usada como sinonimo de valor;
- "prova" que so sera verificavel no fim do checkpoint inteiro.

## 7. Anti-extremos

### Evitar prova minima falsa

Um output tecnico nao conta como valor por si so. A testemunha precisa exercitar
capacidade, garantia, legibilidade ou honestidade em um entrypoint real ou em
artefato revisavel.

### Evitar checkpoint grande demais

Cada etapa deve declarar um unico valor independente. Se a etapa so consegue
provar valor depois da etapa seguinte, ela esta mal fatiada ou precisa de
disposicao via `GG-0005`.

## 8. Forma recomendada agora

Prova de valor deve ser:

- **lente agora;**
- **check depois, em `broad-flow-falsification`, apenas para a testemunha;**
- **campo ou no de grafo apenas se uma query/check real exigir, conforme o
  criterio de modelagem do compilado.**

Nao deve virar agora:

- `ValueClaim` como entidade persistida;
- `proof_of_value` como campo obrigatorio;
- lifecycle proprio;
- motor de valor;
- bloqueio automatico de readiness.

## 9. Aplicacao proposta as etapas restantes da Spec 0024

Esta tabela e proposta de planejamento. Nao altera `tasks.md`, `plan.md` ou
`decision-brief.md`.

| Etapa                                         | Valor entregue                                                                                                                                                                                | Aceite de valor                                                                                                                                                                             | Nao conta                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `artifact-taxonomy-and-model-review-contract` | Pessoa ou maquina le a natureza de um artefato e a ordem de autoridade do dominio por um `kind` unico; review pre-codificacao tem casa e autoridade. Antes, isso era implicito ou divergente. | Classificar artefatos reais e resolver pelo menos uma ambiguidade real de autoridade por regra unica demonstravel; `model-review` existe como tipo com schema/check ou e rejeitado por DEC. | Criar `kind` sem resolver ambiguidade real. Output nao e valor.  |
| `internal-architecture-refactor-ddd-bdd`      | Um mantenedor localiza e entende uma fatia do runtime sem ler arquivos gigantes; grafo/snapshot responde ao menos uma query real derivada do repo; comportamento permanece identico.          | Uma tarefa de navegacao real que antes exigia varrer arquivos grandes passa a resolver por estrutura nomeada; testes provam preservacao; snapshot regeneravel responde a query escolhida.   | Mover arquivos sem demonstrar tarefa de navegacao ou query real. |
| `broad-flow-falsification`                    | Uma jornada nao obvia do lifecycle e falsificavel automaticamente sobre runtime real, e pelo menos um incremento prova valor, nao apenas transicao valida.                                    | Uma jornada pega problema real que dogfood manual pegaria sobre fixtures unificadas; pelo menos uma fixture inclui value-assertion.                                                         | Check verde que nunca e exercido por cenario real.               |
| `continuation-review-human-gate`              | A owner decide o Human Gate com revisao independente que confirma coerencia ponta-a-ponta do no.                                                                                              | Revisao independente registrada, zero finding bloqueante aberto e Gate decidivel.                                                                                                           | Marcar review sem boundary agregado ou com bloqueante aberto.    |

Observacao: `continuation-review-human-gate` e terminal por natureza. O guardrail
e que as etapas anteriores ja provem valor antes do gate; o gate nao deve ser o
primeiro ponto em que valor aparece.

## 10. Riscos reais

- Criar um `value engine` antes de uma necessidade comprovada.
- Aceitar prova minima falsa como valor.
- Transformar os quatro tipos de valor em terceira taxonomia.
- Confundir readiness com valor.
- Inflar o PR #45 com mecanismo de valor.
- Reabrir G00/G02/G06/G07 ou superseder G08/G22/G23.
- Escrever linhas em `tasks.md`/`plan.md` antes de DEC ou aprovacao explicita.

## 11. O que nao implementar ainda

- Nao criar entidade `ValueClaim`.
- Nao criar campo `proof_of_value`.
- Nao criar check automatizado de valor.
- Nao mudar topologia, sequencia ou `state.yml`.
- Nao mudar readiness.
- Nao inserir a tabela em `tasks.md` ou `plan.md` sem decisao posterior.
- Nao acoplar valor a banco/grafo/snapshot agora.

## 12. Proximo artefato minimo

Possivel DEC pequena/aditiva, candidata a G24 ou subponto de G23:

> Adotar "Valor entregue + Aceite de valor" como lente de planejamento para
> etapas/checkpoints, reusando o slot de criterio de saida, sem criar campo,
> entidade, motor ou bloqueio automatico agora.

Promocao sugerida:

- conceito permanece neste research;
- adocao da lente vira DEC;
- aplicacao por etapa entra inline em `tasks.md`/`plan.md`, se aprovada;
- testemunha executavel vira check apenas em `broad-flow-falsification`.

## 13. Relacao com proximas rodadas

Este R2 reduz a urgencia de criar grafo/banco para resolver a dor de valor.
A proxima investigacao mais util e R1/R5:

- papel dos 7 MECE;
- catalogo minimo de queries reais para graph snapshot e banco;
- separacao entre queries locais, site/simulador e cross-repo empresarial.
