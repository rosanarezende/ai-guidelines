# Direcionamento pos-G23 — proximas decisoes, pesquisas e spikes

- **Data:** 2026-06-23
- **Spec:** 0024 — context-architecture
- **Checkpoint ativo:** `artifact-taxonomy-and-model-review-contract` (PR #45)
- **Natureza:** research/direction, registro de sintese de revisao
- **Origem:** rodada Claude Code posterior aos commits de G23
- **Autoridade:** nao-operacional. Em divergencia, vencem `state.yml`,
  `tasks.md`, `decision-brief.md`, reviews/gates, Git e GitHub.

## 1. Por que este artefato existe

Apos a auditoria decidido-vs-aberto e o registro de `[DEC-0024-G23]`, Claude
Code produziu um mapa de proximas decisoes, pesquisas e spikes. O valor do mapa
e preservar a ordem de dependencia entre os temas novos:

1. forma do grafo operacional;
2. prova de valor incremental;
3. contrato do graph snapshot;
4. contrato de `fixtures/journeys`;
5. banco orientado a grafo estritamente derivado.

Este arquivo registra essa sintese como insumo de decisao. Ele nao cria DEC,
nao altera topologia, nao autoriza implementacao e nao substitui o plano/tarefas.

## 2. Veredito capturado

G23 fixou o envelope:

- grafo e banco sao derived-only, nao SSOT;
- nao ha nova spec, nova frente ou novo repo neste momento;
- perguntas novas devem ser roteadas para etapas existentes;
- cada item aberto deve fechar em uma DEC na etapa dona.

O que falta agora:

- uma decisao de modelagem pivo: forma do grafo operacional;
- uma decisao de valor: prova de valor incremental;
- dois contratos: graph snapshot e `fixtures/journeys`;
- uma decisao deferida: banco orientado a grafo, depois de snapshot e queries
  reais.

Regra de ouro:

> Contrato antes de banco, projecao antes de motor, uma fixture antes de
> framework, e cada item aberto fecha em uma DEC na etapa dona.

## 3. Mapa-espinha

| #   | Item                                                | Tipo                      | Etapa/checkpoint dona                                                   | Valor destravado                                 |
| --- | --------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Prova de valor como disciplina de planejamento      | Research + aplicacao leve | `broad-flow-falsification` como principio; aplicavel ja no planejamento | Valor intermediario na propria 0024              |
| 2   | Papel dos 7 MECE                                    | Research G01/F-AG01       | Foundational G01                                                        | Tipagem limpa do grafo; evita terceira taxonomia |
| 3   | `kind` como semente de tipo de no do grafo          | Execucao ja no escopo     | PR #45                                                                  | Vocabulario tipado unico para jusante            |
| 4   | Forma do grafo operacional                          | DEC A1                    | `internal-architecture-refactor-ddd-bdd`                                | Grafo de governanca consultavel                  |
| 5   | Contrato do graph snapshot derivado                 | DEC + contrato            | `internal-architecture-refactor-ddd-bdd`                                | Site, simulador e dashboards de uma derivacao    |
| 6   | Contrato `fixtures/journeys` e unificacao de fontes | DEC + contrato            | `broad-flow-falsification`                                              | Falsificacao automatizada                        |
| 7   | Falsificacao de prova de valor                      | Check/execucao            | `broad-flow-falsification`                                              | Verificacao mecanica de valor entregue           |
| 8   | Banco orientado a grafo                             | DEC deferida              | spike `knowledge-graph-store-spike`                                     | Cross-repo, dashboards e visao empresarial       |

## 4. Decisoes pendentes

### DP1 — Forma do grafo operacional

Escolher entre:

- estender `KnowledgeGraph`;
- criar novo bounded context;
- criar read-model acima de contexts.

Dona: `internal-architecture-refactor-ddd-bdd`.

Essa decisao condiciona o contrato de snapshot, as queries e os consumidores.

### DP2 — Prova de valor incremental

Decidir se Checkpoint/Etapa carrega prova explicita de valor, se isso e campo,
lente derivada ou check.

Dona: `broad-flow-falsification`, com DEC propria.

### DP3 — Contrato do graph snapshot

Definir schema minimo:

- nodes;
- edges;
- source refs;
- hashes;
- determinismo;
- regenerabilidade.

Depende de DP1. Dona: `internal-architecture-refactor-ddd-bdd`.

### DP4 — Contrato `fixtures/journeys`

Decidir se mini-repos serao:

- snapshots;
- historico Git sintetico;
- comandos executaveis;
- combinacao desses formatos.

Tambem precisa unificar `tests/consumer-journey/fixtures` e
`site/src/content/simulatorProjects.ts`/`site:scenarios`.

Dona: `broad-flow-falsification`.

### DP5 — Papel dos 7 MECE

Convergir F-AG01/G01. Hipotese recomendada a falsificar: MECE como
projecao/lente de planejamento e revisao, nao eixo primario nem terceira
taxonomia.

Dona: foundational G01.

### DP6 — Tarefa parseavel

Decidir se `Tarefa` vira leaf consultavel ou permanece documental.

Dona: `broad-flow-falsification`. Baixa prioridade frente a DP1-DP5.

### DP7 — Banco orientado a grafo

Decidir se adotar banco e qual tecnologia comparar/adotar. Exemplos citados em
research anterior: Neo4j, Memgraph, Kuzu, ArangoDB, SurrealDB.

Dona: spike `knowledge-graph-store-spike`, depois de snapshot e catalogo de
queries reais. Estritamente derived-only.

## 5. Research necessario

### R1 — Papel do MECE

Convergir F-AG01.

Hipotese a falsificar:

> MECE e projecao/lente de planejamento-revisao, nao eixo primario nem terceira
> taxonomia.

### R2 — Conceito minimo de prova de valor

Definir o que significa "valor entregue" em incremento governado. Reusar
`Outcome` e `AcceptanceCriterion` antes de inventar uma taxonomia nova.

Proximo passo minimo recomendado por Claude:

> nota curta em `research/` que define prova de valor e aplica `value-claim` +
> criterio de aceite a cada etapa restante da 0024.

### R3 — Schema do graph snapshot

Investigar como derivar snapshot de `state.yml`, `tasks.md`,
`decision-brief.md`, reviews e gates de forma deterministica.

### R4 — Forma das fixtures/journeys

Definir contrato e plano de migracao sem quebrar valor ja testado.

### R5 — Catalogo de queries reais

Coletar perguntas que justificam grafo/snapshot/banco:

- o que bloqueia X?
- qual e a proxima acao?
- quais dependencias estao incompletas?
- quais provas de valor existem?
- quais riscos persistem?
- quais specs/repos estao parados por gate, review ou ausencia de valor?

Esse catalogo alimenta DP3 e justifica, ou rejeita, DP7.

## 6. Spikes necessarios

### S1 — Gerador de snapshot

PoC sobre o repo real da 0024 com 2 ou 3 queries reais.

Objetivo: reduzir risco de DP1/DP3 antes de fechar contrato.

### S2 — Banco orientado a grafo

PoC carregando o snapshot. So deve ocorrer depois de S1 + R5.

Objetivo: decidir DP7 sem DB-first e sem criar segunda SSOT.

### S3 — Value assertion em uma fixture

Provar o conceito de falsificar valor em uma fixture antes de generalizar.

Objetivo: reduzir risco de H3/DP2 sem criar um "value engine".

## 7. Sequencia recomendada

1. Agora, barato e sem mexer na sequencia: R2 + aplicar `value-claim` e aceite
   as etapas restantes da 0024.
2. Agora ou em paralelo: R1 para destravar o papel do MECE na tipagem futura.
3. No PR #45: `kind` como semente de tipo de no, sem grafo/snapshot/banco.
4. Em `internal-architecture-refactor-ddd-bdd`: R3 + S1, depois DP1 e DP3.
5. Em `broad-flow-falsification`: R4 + DP4 + S3, depois DP2.
6. Por ultimo, gated: R5 + S2, depois DP7.

## 8. Valor destravado por item

- Prova de valor na propria 0024: reduz checkpoint grande sem prova
  intermediaria agora.
- MECE + `kind`: cria base tipada unica, sem taxonomia paralela.
- Grafo derivado consultavel: mecaniza next-action, bloqueios e dependencias.
- Snapshot: permite site, simulador e dashboards de uma fonte derivada.
- Fixtures/journeys: reduz dogfood manual tardio.
- Falsificacao de valor: verifica se incremento entregou valor, nao apenas se
  transicao foi valida.
- Banco derivado: habilita agregacao cross-repo e dashboards empresariais.

## 9. Guardrails anti-blank-slate

- Nao fazer DB-first: S2 so depois de S1, contrato e queries.
- Nao transformar MECE em terceira taxonomia.
- Nao criar "value engine" antes de uma fixture.
- Nao inchar PR #45 com grafo, snapshot ou prova de valor.
- Nao reabrir G00/G02/G06/G07 nem superseder G08/G22/G23.
- Nao reordenar a sequencia congelada.
- Nao tratar grafo como reescrita da arvore: ele e projecao aditiva.
- Nao deixar research notes virarem fontes paralelas: cada item aberto deve
  resolver em uma DEC na etapa dona.

## 10. Proximo passo minimo recomendado

Criar R2:

> Research curta que define o conceito minimo de prova de valor e aplica
> `value-claim` + criterio de aceite a cada etapa restante da Spec 0024.

Esse passo ataca a dor original imediatamente, sem antecipar grafo, snapshot,
banco ou simulador.

## 11. Rodadas investigativas recomendadas

### Rodada 1 — R2: prova de valor incremental

Pergunta para proxima revisao:

```md
Sem editar arquivos, investigue como definir o conceito minimo de prova de valor
para a Spec 0024.

Objetivo:

- propor uma research curta R2;
- definir `value-claim` e criterio de aceite para cada etapa restante da 0024;
- evitar "prova minima falsa" e "checkpoint grande demais";
- nao criar value engine;
- nao alterar tasks/plan/brief ainda.

Formato:

- Veredito curto
- Conceito minimo
- Value-claim por etapa restante
- Criterio de aceite por etapa
- Riscos
- Proximo artefato minimo
```

### Rodada 2 — R1/R5: MECE e queries

Pergunta para proxima revisao:

```md
Sem editar arquivos, investigue o papel dos 7 tipos MECE e o catalogo minimo de
queries que justificam graph snapshot/banco.

Objetivo:

- decidir se MECE e lente/projecao, propriedade ou eixo primario;
- listar queries reais que o grafo precisa responder;
- separar o que deve ir para PR #45, internal-refactor, broad-flow ou spike
  futuro;
- evitar terceira taxonomia e evitar DB-first.

Formato:

- Veredito curto
- Hipotese MECE
- Queries reais
- Impacto no kind/grafo/snapshot
- Riscos
- Proximo artefato minimo
```
