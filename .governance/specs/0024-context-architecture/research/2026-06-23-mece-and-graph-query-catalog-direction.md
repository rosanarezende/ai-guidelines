---
artifact-kind: research
---

# Direcao — Papel dos 7 MECE e catalogo de queries do grafo

- **Data:** 2026-06-23
- **Spec:** 0024 — context-architecture
- **Checkpoint ativo:** `artifact-taxonomy-and-model-review-contract` (PR #45)
- **Natureza:** research/direction, investigacao R1/R5
- **Origem:** rodada Claude Code sobre MECE, `kind`, graph snapshot e banco
- **Autoridade:** nao-operacional. Em divergencia, vencem `state.yml`,
  `tasks.md`, `decision-brief.md`, reviews/gates, Git e GitHub.
- **Status:** insumo para possivel DEC pequena/aditiva; nao e DEC.

## 1. Por que este artefato existe

Depois da investigacao R2 sobre prova de valor incremental, a proxima duvida era
como encaixar os 7 tipos MECE sem criar uma terceira taxonomia concorrente com:

- `kind` de artefatos no PR #45;
- tipos de nos do grafo;
- stage/lifecycle;
- lente de valor incremental.

Tambem era necessario levantar um catalogo minimo de queries reais para separar:

- o que cabe em graph snapshot JSON local;
- o que justificaria banco orientado a grafo no futuro;
- o que deve influenciar PR #45, `internal-architecture-refactor-ddd-bdd`,
  `broad-flow-falsification` e eventual spike de banco.

## 2. Veredito capturado

Nao ha tres taxonomias. Ha:

- um mecanismo `kind`, aplicado a classes de no diferentes;
- eixos ortogonais que respondem perguntas diferentes;
- MECE como `WorkItemKind` governado por ADR 0010;
- banco orientado a grafo apenas para queries cross-repo, agregadas ou
  interativas em escala.

Hipotese recomendada:

> MECE e propriedade `kind` de nos da classe work-item, governada por uma Rule
> (ADR 0010), projetavel como lente derivada de planejamento/revisao. Nao e eixo
> primario, nao e entidade/no proprio, e nao e taxonomia nova.

## 3. Relacao MECE, `kind`, grafo e valor

Quatro eixos respondem perguntas diferentes:

| Eixo              | Pergunta                      | Representacao no grafo               | Exemplos                                                        |
| ----------------- | ----------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| Tipo de no        | Que coisa e?                  | label/classe do no                   | Spec, Checkpoint, Etapa, Decision, Review, Gate, Artifact       |
| `kind` / natureza | Que natureza ou intencao tem? | propriedade do no, por classe        | `WorkItemKind` em work-items; artifact-`kind`; knowledge-`kind` |
| stage / estado    | Onde esta no lifecycle?       | propriedade do no                    | discovery, implementation, review, done; insight -> doctrine    |
| tipo de valor     | Que valor entrega?            | lente derivada, nao armazenada agora | capacidade, garantia, legibilidade, honestidade                 |

Conclusoes:

- MECE e `kind` compartilham o mesmo mecanismo: natureza discriminada por regra.
- MECE nao vira tipo de no.
- MECE pode informar planejamento e revisao, mas nao substitui Review/Gate.
- Value-claim e independente de MECE: um work-item pode ter `kind` e tambem um
  value-claim.
- G01 continua dona da gramatica primaria; R1 fixa apenas o papel do MECE como
  propriedade/lente.

## 4. Catalogo de queries reais

Regra de tier:

> Banco so se justifica para query cross-repo, agregada em escala ou ad-hoc
> interativa sobre grafo grande unido. Single-repo cabe em snapshot JSON +
> traversal em memoria.

| Query real                                                   | Tier                  | Snapshot JSON basta?           | Banco justificado? | Valor destravado       | Dona                                                                  |
| ------------------------------------------------------------ | --------------------- | ------------------------------ | ------------------ | ---------------------- | --------------------------------------------------------------------- |
| Proxima acao governada da spec X                             | local/atual           | Sim                            | Nao                | next-action            | `internal-architecture-refactor-ddd-bdd`                              |
| O que bloqueia checkpoint/etapa Y agora                      | local/atual           | Sim                            | Nao                | desbloqueio            | `internal-architecture-refactor-ddd-bdd`                              |
| Dependencias de Y estao completas?                           | local/atual           | Sim                            | Nao                | completude             | `internal-architecture-refactor-ddd-bdd`                              |
| Findings, reviews e gates abertos no no ativo                | local/atual           | Sim                            | Nao                | gate honesto           | `internal-architecture-refactor-ddd-bdd` / `broad-flow-falsification` |
| Proveniencia da decisao D                                    | local/grafo           | Sim                            | Nao                | rastreabilidade        | `internal-architecture-refactor-ddd-bdd`                              |
| Projecao P bate com a SSOT?                                  | local/atual           | Sim                            | Nao                | honestidade            | `internal-architecture-refactor-ddd-bdd`                              |
| Value-claim e aceite da etapa ativa estao satisfeitos?       | local/atual           | Sim                            | Nao                | prova de valor         | `broad-flow-falsification`                                            |
| Cadeia transitiva de bloqueios ate concluir a spec           | local/recursivo       | Sim                            | Nao                | caminho critico        | `internal-architecture-refactor-ddd-bdd`                              |
| Impacto de superseder decisao D                              | local/recursivo       | Sim                            | Nao                | impacto de mudanca     | `internal-architecture-refactor-ddd-bdd`                              |
| Evolucao temporal de readiness/findings por commit           | local/temporal        | Sim, com snapshots versionados | Talvez             | historico              | `broad-flow-falsification` / spike                                    |
| Em todos os repos da empresa, o que esta bloqueado e por que | cross-repo            | Nao                            | Sim                | visao de portfolio     | spike de banco                                                        |
| Valor entregue por tipo no trimestre, por repo/time          | cross-repo/agregado   | Nao                            | Sim                | dashboard de lideranca | spike de banco                                                        |
| Guardrails ou decisoes mais violados entre repos             | cross-repo/padrao     | Nao                            | Sim                | governanca global      | spike de banco                                                        |
| Linhagem de decisao cross-repo                               | cross-repo/grafo      | Nao                            | Sim                | lineage organizacional | spike de banco                                                        |
| Drill-down interativo ad-hoc sobre muitos repos              | cross-repo/interativo | Nao                            | Sim                | exploracao analitica   | spike de banco                                                        |

## 5. Queries locais vs cross-repo

### Locais

Tudo que alimenta `work`, `decide`, Governance Doctor, `pr-ready`, review e lente
de valor para um unico repo cabe em snapshot JSON e traversal em memoria.

Inclui:

- estado atual;
- algumas consultas recursivas;
- historico Git por snapshots versionados;
- impacto local de decisoes;
- bloqueios transitivos.

### Cross-repo

Banco orientado a grafo comeca a fazer sentido quando ha:

- identidade global entre repos;
- grafo grande unido;
- queries ad-hoc interativas;
- agregacao por empresa/time/repo;
- concorrencia e dashboards persistentes.

A escolha do engine (Neo4j, Memgraph, Kuzu, ArangoDB, SurrealDB ou outro) deve
ser decisao de spike futuro, avaliada contra queries reais.

## 6. Impacto por etapa

### PR #45 — `artifact-taxonomy-and-model-review-contract`

O `kind` materializado no PR #45 deve ser a semente de tipo/natureza de no para
artefatos, usando o mesmo mecanismo conceitual do `WorkItemKind`, mas sem criar
eixo MECE separado.

Nao implementar grafo no PR #45.

### `internal-architecture-refactor-ddd-bdd`

O contrato do snapshot deve carregar, por no:

- identidade estavel e cross-repo-ready;
- tipo de no;
- `kind`;
- stage;
- source ref;
- hash;
- arestas.

Objetivo: responder todas as queries locais sem banco e deixar a ingestao futura
por banco possivel sem redesenhar identidade.

### `broad-flow-falsification`

As queries de prova de valor, drift e bloqueio devem virar testemunhas
falsificaveis. A query temporal pode exigir snapshots versionados.

### Spike de banco

So deve abrir quando existir pelo menos uma query Tier 2 real, nao hipotetica,
vinda de uso multi-repo ou agregacao organizacional.

## 7. Guardrails

- Nao fazer DB-first.
- Nao tratar MECE como no/eixo primario.
- Nao criar terceira taxonomia.
- Nao reabrir G01 ao decidir apenas o papel do MECE.
- Nao criar no/aresta sem query/check/projecao que precise disso.
- Nao criar snapshot com identidade local demais.
- Nao exigir banco para queries single-repo.

## 8. Riscos reais

- Banco virar segunda SSOT se preceder snapshot e contrato.
- MECE concorrer com `kind` e artifact taxonomy.
- G01 ser reaberto indevidamente por confundir papel do MECE com gramatica
  primaria.
- Snapshot nascer sem identidade global-ready e causar retrabalho para
  cross-repo.
- Queries hipoteticas justificarem tecnologia antes de valor real.

## 9. Proximo artefato minimo

Possivel DEC pequena/aditiva, candidata a G24 ou subponto de G23:

1. papel do MECE = propriedade `kind` + lente, via ADR 0010, invariante a G01;
2. regra de tier do snapshot/banco:
   - local/single-repo = snapshot JSON;
   - banco apenas por query cross-repo, agregada ou interativa em escala;
3. contrato de snapshot deve ser cross-repo-ready desde o inicio.

O catalogo de queries vira insumo de aceite para
`internal-architecture-refactor-ddd-bdd` e para eventual spike de banco. Nao
autoriza implementacao de grafo ou banco agora.

## 10. Relacao com proximas rodadas

Depois de R2 e R1/R5, a proxima investigacao util pode ser uma destas:

1. **R3/S1 — graph snapshot minimo:** selecionar 2 ou 3 queries locais e propor
   o menor schema de snapshot que as responde.
2. **DEC G24 — consolidacao das lentes:** propor a menor DEC aditiva que adota
   prova de valor e papel do MECE sem virar engine.
3. **PR #45 scope check:** revisar se `kind`/taxonomia/model-review continuam
   suficientes apos G23/R2/R1, sem inflar o PR.
