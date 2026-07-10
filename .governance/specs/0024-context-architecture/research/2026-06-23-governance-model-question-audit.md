---
artifact-kind: pre-coding-review
subject: "auditoria decidido-vs-aberto das perguntas do modelo de governanca"
date: 2026-06-23
disposition: evidence
---

# Auditoria — perguntas do modelo de governança (decidido vs aberto)

- **Data:** 2026-06-23 · **Spec:** 0024 — context-architecture
- **Natureza:** research / **não-autoridade**. Não promove nada sozinho; alimenta uma futura DEC.
- **Autoridade:** em divergência vencem `state.yml`, `tasks.md`, `decision-brief.md`,
  `reviews/`, `gates/`, Git e GitHub (cf. `research/README.md`).
- **Escopo:** audita as perguntas de
  `research/2026-06-23-governance-graph-incremental-delivery-and-query-layer-direction.md`
  (o "compilado") e de `research/2026-06-23-broad-flow-falsification-direction.md`.
  **Não é DEC.** Não altera topologia e não autoriza implementação.

## Por que este artefato existe

O compilado mistura **perguntas já decididas**, **parcialmente decididas** e
**genuinamente novas**. Sem triagem, o risco é duplo: (a) **reabrir decisões `Resolved`**
— sobretudo `[DEC-0024-G08]`, que já fixou "grafo dentro da 0024, sem 0025 independente" —,
recaindo no blank-slate que a própria owner teme; ou (b) **enterrar a única lacuna nova real**
(entrega incremental / prova de valor) por supô-la já coberta. Esta auditoria separa os três
casos, nomeia a etapa dona de cada lacuna e marca o risco de reabrir o que já está decidido.

## Legenda de status

- **Resolved** — já existe disposição governada; reabrir é regressão.
- **Parcial** — há fonte que resolve parte; resta uma lacuna nomeável.
- **Aberta** — sem disposição; é trabalho legítimo (modelagem, não regressão).

## Correções de leitura (face a revisões anteriores)

1. **`[DEC-0024-G01]` está Aberto** (`F-AG01`): "pilares MECE _vs_ estados>entidade" seguem
   alternativas vivas. O **7-MECE não é decidido** — é a casa aberta de H5.
2. **`[DEC-0024-G05]` (projeções) está Reaberto para modelagem** por `[DEC-0024-G08]`, não
   fechado. Projeção-vs-entidade é trabalho, não regressão.
3. **`[DEC-0024-G08]` já prende o grafo na 0024 e rejeitou a 0025 independente.** "Nova
   spec-modelo" = **superseder decisão Resolved da owner** (risco Alto), não escolha neutra.
4. A lacuna de **prova de valor incremental (H3)** é real e **sem casa**: a etapa ativa diz
   textualmente "Não é prova mínima".

---

## Tabela mestra (7 campos por pergunta)

Colunas: **Pergunta · Status · Fonte governada · Lacuna restante · Etapa dona · Critério de aceite · Risco de reabrir.**

### G-A. Modelo de governança (compilado §8.1)

| #   | Pergunta                                                                                           | Status  | Fonte governada                                                                                          | Lacuna restante                                                   | Etapa dona                                    | Critério de aceite                                                                            | Risco de reabrir                                     |
| --- | -------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| A1  | Grafo operacional = estender KnowledgeGraph / novo bounded context / read-model acima de contexts? | Aberta  | `[DEC-0024-G08]` reabre G05 p/ modelagem; `KnowledgeGraph` em `src/app/projections/` modela só Knowledge | falta modelar lifecycle operacional como grafo e escolher a forma | `internal-architecture-refactor-ddd-bdd`      | DEC escolhe 1 das 3 formas, justificada por consulta/travessia/check real (§5.3 do compilado) | Baixo — G05 já reaberto p/ modelagem                 |
| A2  | Checkpoint carrega prova de valor explícita?                                                       | Aberta  | nenhuma (etapa ativa diz "Não é prova mínima" = ausência)                                                | sem conceito governado de proof-of-value                          | DEC novo → `broad-flow-falsification`         | DEC define se é campo, lente derivada ou check                                                | Baixo (novo)                                         |
| A3  | Etapa = subdivisão técnica, prova incremental ou ambas?                                            | Parcial | `[DEC-0024-G22]` (Etapa = subdivisão opcional)                                                           | G22 não a liga a prova de valor                                   | DEC (H3)                                      | refino **aditivo** de G22 (lente), sem redefinir vocabulário                                  | Médio — refinar G22 toca vocabulário; manter aditivo |
| A4  | Tarefa documental ou leaf consultável no grafo?                                                    | Parcial | `[DEC-0024-G22]` (Tarefa = folha/evidência); nota broad-flow marca "Tarefa parseada = decisão futura"    | parser para na Etapa                                              | `broad-flow-falsification`                    | DEC sobre parsear/consultar Tarefa                                                            | Baixo                                                |
| A5  | Decision = nó primário, artifact ou evento?                                                        | Parcial | etapa de taxonomia (`kind`); ledger no `decision-brief.md`                                               | papel no grafo indefinido                                         | PR #45 (kind) → `internal-…-refactor` (papel) | taxonomia atribui `kind`; papel de grafo deferido                                             | Baixo                                                |
| A6  | Review/Gate = entidades primárias ou artefatos com arestas?                                        | Parcial | `review:check`, `gates/`, `gate-decidability`; contrato model-review em #45                              | papel no grafo indefinido                                         | PR #45 (schema) → `internal-…-refactor`       | model-review-contract define Review; grafo deferido                                           | Baixo                                                |

### G-B. Entrega incremental + prova de valor (compilado §8.2) — **dimensão nova**

| #   | Pergunta                                                                    | Status | Fonte                               | Lacuna                                  | Etapa dona                            | Aceite                                         | Risco                        |
| --- | --------------------------------------------------------------------------- | ------ | ----------------------------------- | --------------------------------------- | ------------------------------------- | ---------------------------------------------- | ---------------------------- |
| B1  | Representar "menor incremento governado com valor verificável"?             | Aberta | nenhuma                             | sem conceito de MVI                     | DEC (H3) → `broad-flow-falsification` | DEC define minimal-viable-increment            | Baixo                        |
| B2  | O que impede prova mínima falsa?                                            | Aberta | `GG-0005` (parcial, só anti-débito) | sem check positivo de valor             | `broad-flow-falsification`            | check de falsificação de valor                 | Baixo                        |
| B3  | O que impede checkpoint grande demais?                                      | Aberta | nenhuma                             | sem restrição de tamanho                | DEC (H3)                              | DEC + heurística/check de sizing               | Baixo                        |
| B4  | ValueClaim/Outcome/Proof/AcceptanceCriterion ligam a Checkpoint/Etapa como? | Aberta | nenhuma                             | sem ligação modelada                    | DEC (H3)                              | só vira nó/aresta se houver query/check (§5.3) | Baixo (vigiar over-modeling) |
| B5  | Como fixture prova valor incremental, não só transição válida?              | Aberta | nota broad-flow (fixtures/journeys) | fixture hoje prova transição, não valor | `broad-flow-falsification`            | journey afirma valor entregue                  | Baixo                        |

### G-C. Falsificação e fixtures (compilado §8.3)

| #   | Pergunta                                                      | Status  | Fonte                                                                                            | Lacuna                 | Etapa dona                 | Aceite                                               | Risco |
| --- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ | ---------------------- | -------------------------- | ---------------------------------------------------- | ----- |
| C1  | Contrato canônico de `fixtures/journeys`?                     | Parcial | `broad-flow-falsification-direction.md`                                                          | contrato não escrito   | `broad-flow-falsification` | contrato documentado                                 | Baixo |
| C2  | Mini-repos = snapshot / git sintético / comandos executáveis? | Aberta  | —                                                                                                | forma indefinida       | `broad-flow-falsification` | DEC/escolha registrada                               | Baixo |
| C3  | Site, simulador e testes consomem a mesma fonte?              | Parcial | nota broad-flow (2 fontes paralelas: `tests/consumer-journey/fixtures` × `simulatorProjects.ts`) | não unificadas         | `broad-flow-falsification` | repoint c/ condição de retomada (GG-0005)            | Baixo |
| C4  | Migrar fixtures sem quebrar valor testado?                    | Aberta  | —                                                                                                | sem plano de migração  | `broad-flow-falsification` | migração gradual com testes verdes                   | Baixo |
| C5  | Quando dogfood humano ainda é necessário (H2)?                | Parcial | compilado H2 (reposicionamento)                                                                  | fronteira não definida | `broad-flow-falsification` | regra: descoberta→fixtures, validação situada→humano | Baixo |

### G-D. Camada de consulta / snapshot / banco (compilado §8.4) — **dimensões novas**

| #   | Pergunta                                                  | Status  | Fonte                                                                                                                 | Lacuna                                      | Etapa dona                          | Aceite                                                               | Risco |
| --- | --------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------- | ----- |
| D1  | Contrato mínimo do **graph snapshot derivado**?           | Aberta  | `graph-store-options.md` (snapshot/read-model derivado); G05                                                          | schema não definido                         | `internal-…-refactor`               | snapshot determinístico: nodes/edges/source-refs/hashes, regenerável | Baixo |
| D2  | Identidades globais cross-repo?                           | Aberta  | —                                                                                                                     | identidade global indefinida                | futuro (cross-repo)                 | DEC futura; **não agora**                                            | Baixo |
| D3  | Representar org/repo/spec/…/tarefa sem acoplar ao GitHub? | Parcial | `[DEC-0024-G07]` (topology-as-data); G22 (PR ≠ autoridade)                                                            | falta camada cross-repo                     | `internal-…-refactor`               | modelo desacoplado do GitHub                                         | Baixo |
| D4  | Quais queries justificam **banco grafo**?                 | Aberta  | `graph-store-options.md §6.2` (critérios)                                                                             | catálogo de queries ausente                 | spike `knowledge-graph-store-spike` | catálogo de queries que JSON não atende                              | Baixo |
| D5  | **Banco grafo estritamente derivado**: Neo4j ou comparar? | Parcial | `graph-store-options.md` (Neo4j candidato; Cassandra baixo-fit)                                                       | Memgraph/Kuzu/Arango/Surreal não comparados | spike futuro                        | comparação com critério                                              | Baixo |
| D6  | Provar que banco é projeção derivada/regenerável?         | Parcial | `graph-store-options.md` ("projeção derivada reconstruível"); `GG-0005`; `[DEC-0024-G07]` ("projeção NÃO governança") | falta check de drift repo↔banco             | spike + `broad-flow-falsification`  | check de regeneração/drift                                           | Baixo |
| D7  | Proteger informação sensível multi-repo/empresa?          | Aberta  | —                                                                                                                     | sem modelo de isolamento                    | futuro (cross-repo)                 | DEC futura; **não agora**                                            | Baixo |

### G-E. Artefatos e templates (compilado §8.5)

| #   | Pergunta                                                     | Status  | Fonte                                                                    | Lacuna                                              | Etapa dona                     | Aceite                                            | Risco                                                         |
| --- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------ | ------------------------------------------------- | ------------------------------------------------------------- |
| E1  | spec/plan/tasks/decision-brief/research ainda fazem sentido? | Parcial | etapa de taxonomia; `research/README.md` (ordem de autoridade)           | "cada um = view de qual parte" indefinido           | PR #45 → `internal-…-refactor` | permanecem SSOT-views; nenhum substituído sem DEC | **Médio** — questionar artefatos canônicos pode reabrir muito |
| E2  | Cada artefato é view de qual parte do grafo?                 | Aberta  | `[DEC-0024-G05]` (projeção, reaberto)                                    | mapeamento artefato↔grafo                           | `internal-…-refactor`          | matriz artefato→projeção                          | Baixo (G05 reaberto)                                          |
| E3  | O que herdamos de spec-kit por conveniência?                 | Parcial | ADR 0019 (`.specify` legado); `[DEC-0024-G04]` (tri-root)                | inventário explícito ausente                        | PR #45 / trilha G04            | inventário de herança spec-kit                    | Baixo                                                         |
| E4  | Casa única dos templates?                                    | Parcial | `[DEC-0024-G04]` reaberto; drift-guard existe                            | convergência não concluída                          | trilha G04                     | tri-root → SSOT única                             | Baixo (G04 reaberto)                                          |
| E5  | 7 tipos MECE entram como? (H5)                               | Aberta  | `[DEC-0024-G01]` **Aberto** (F-AG01): "pilares MECE vs estados>entidade" | eixo primário vs propriedade vs projeção indefinido | foundational G01               | DEC de G01 escolhe o papel do MECE                | Baixo (G01 já aberto)                                         |

### G-F. Veículo governado (compilado §8.6)

| #   | Pergunta                                 | Status                                  | Fonte                                               | Lacuna                                                         | Etapa dona            | Aceite                                                                       | Risco                                                     |
| --- | ---------------------------------------- | --------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| F1  | Cabe nas etapas planejadas da 0024?      | Resolved (sim)                          | 3 etapas + `[DEC-0024-G08]`                         | —                                                              | —                     | decomposição confirmada (§ Plano)                                            | —                                                         |
| F2  | G08 mantida/refinada/superseded?         | Resolved → **manter + refinar aditivo** | `[DEC-0024-G08]`                                    | G08 não nomeia H3 (prova de valor) nem H4 (camada de consulta) | DEC companheira (G23) | G23 estende envelope de G08, reafirma "sem spec independente / derived-only" | **Alto se superseder** — reabre decisão Resolved da owner |
| F3  | O que fica no PR #45?                    | Resolved                                | etapa `artifact-taxonomy-and-model-review-contract` | —                                                              | PR #45                | escopo atual mantido (§ Plano)                                               | Baixo                                                     |
| F4  | O que espera `internal-…-refactor`?      | Resolved                                | `tasks.md`                                          | —                                                              | etapa                 | grafo operacional + snapshot (§ Plano)                                       | Baixo                                                     |
| F5  | O que espera `broad-flow-falsification`? | Resolved                                | `tasks.md`                                          | —                                                              | etapa                 | fixtures/journeys + prova de valor (§ Plano)                                 | Baixo                                                     |
| F6  | Nova spec / frente / repo?               | Resolved → **Não**                      | `[DEC-0024-G08]` rejeita 0025 independente          | —                                                              | —                     | mérito não atinge o limiar de superseder G08                                 | **Alto** se abrir                                         |

## Dimensões novas obrigatórias — síntese

| Dimensão                                                 | Status agregado                                          | Âncora governada                                        | Onde aterrissa                                                  |
| -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Entrega incremental + prova de valor                     | **Aberta** (única lacuna genuinamente nova)              | nenhuma (gap real)                                      | DEC H3 → `broad-flow-falsification` (+ possível etapa gated)    |
| Grafo de governança operacional                          | **Aberta** (modelagem é direção, G05/G08)                | `KnowledgeGraph` (knowledge-only)                       | `internal-…-refactor`                                           |
| Graph snapshot derivado                                  | **Aberta**                                               | `graph-store-options.md`, G05                           | `internal-…-refactor`                                           |
| Banco grafo estritamente derivado                        | **Parcial** (derived-only já decidido; adoção prematura) | `graph-store-options.md`                                | spike futuro                                                    |
| Uso futuro cross-repo (empresa/dashboard/site/simulador) | **Aberta/Deferred**                                      | —                                                       | futuro; **informa o snapshot agora** p/ não nascer local demais |
| Evitar 2ª SSOT (banco/projeção)                          | **Resolved (guardrail/doutrina)**                        | `graph-store-options.md` + `GG-0005` + `[DEC-0024-G07]` | check de derivação/drift em falsification/spike                 |

---

## Plano de adaptação proposto da Spec 0024 (owner-gated; **não** implementar a partir deste research)

**1. PR #45 `artifact-taxonomy-and-model-review-contract` — permanece.**
Mantém escopo atual (kind/metadado; classificação; ordens de autoridade unificadas;
research-index; promoção p/ research-library; rótulo não-autoridade; contrato de
model-review/pré-coding **ou** rejeição por DEC). Mantém "Não é prova mínima". Refino
_dentro_ do escopo (não amplia): ao materializar `kind`, projetar a taxonomia de artefatos
como **semente compatível com tipos de nó do grafo** (uma taxonomia, não duas), satisfazendo
§5.3 do compilado; fecha A5/A6 **no nível de taxonomia** (Review/Decision/Finding ganham
`kind`; papel de nó/aresta deferido). **Não** adicionar prova de valor, motor de grafo ou banco.

**2. `internal-architecture-refactor-ddd-bdd` — adicionar (aditivo, behavior-preserving).**
Critério: decidir **A1** (estender KnowledgeGraph × novo bounded context × read-model acima de
contexts), ancorado em DDD (KnowledgeGraph já é projeção; governança operacional é outro
contexto). Critério: definir **contrato do graph snapshot derivado** (D1/D3) — nodes/edges/
source-refs/hashes, determinístico, regenerável, offline — como fronteira de projeção (G05).
Refino: expor o contrato fonte↔projeção (G05) para site/simulador/futuro-banco serem
**consumidores de UMA derivação** (anti-2ª-SSOT). **Não** adicionar adapter de banco nem
identidade cross-repo (spike futuro).

**3. `broad-flow-falsification` — adicionar/refinar.**
Adicionar: contrato `fixtures/journeys` (C1); unificar as 2 fontes (C3); repoint de
`simulatorProjects.ts`/`site:scenarios` com condição de retomada (GG-0005). Adicionar (H3/B5/B2):
**falsificação de prova de valor** — journey afirma _valor entregue_, não só _transição válida_ —,
dando casa à lacuna de entrega incremental sem modelo pesado. Adicionar (H2/C5): fronteira
dogfood-humano × fixtures.

**4. Nova etapa/checkpoint? — Não agora.** A única dimensão sem casa é prova de valor (H3);
registrá-la primeiro como research→DEC. Só materializar a etapa
`incremental-delivery-and-proof-of-value-model` (entre refactor e falsification) **se** a DEC
concluir que precisa de implementação dedicada. Preserva a sequência.

**5. G08 — refinar aditivo, não superseder.** Propor **DEC companheira (próx. livre = G23)**
que estende o envelope de G08 para cobrir H3 (entrega incremental) e H4 (camada de consulta /
snapshot derivado), **reafirmando**: sem spec independente, derived-only, sem 2ª SSOT.
Superseder G08 é o movimento perigoso (reabre decisão Resolved da owner).

**6. Preservar sequência sem blank-slate.** Ordem das etapas intacta. Cada dimensão entra como
**critério de aceite** ou **research→DEC** numa etapa existente, nunca reordenando. O grafo é
**projeção derivada** sobre o SSOT atual (Markdown/YAML permanece SSOT) — aditivo, o oposto de
redesenho. Regra-âncora: _"modelar = adicionar projeção + contrato, não reescrever a árvore"_.
Honra G08 ("modelar é a direção em G03/G04/G05") e mantém G00/G02/G06/G07 cravados.

**7. O que vira o quê:**

- **research (agora):** este audit + o compilado (não-autoridade).
- **decision-brief (na aprovação):** DEC G23 (estende G08 p/ H3+H4, derived-only/sem-2ª-SSOT);
  nota de que G01 segue a casa aberta do MECE (H5); registro de A5/A6 fechados em #45 no nível
  de taxonomia.
- **tasks.md (na aprovação; não agora):** critérios em `internal-…-refactor` (A1 + snapshot D1)
  e `broad-flow-falsification` (C1/C3 + prova de valor B5); etapa H3 opcional, gated pela DEC.
- **plan.md (na aprovação):** refletir critérios na narrativa Sequência/Topologia só se mudarem escopo.
- **NÃO** alterar `state.yml`/`tasks.md`/`plan.md`/`decision-brief.md` a partir só deste research
  (GG-0005): muda via DEC Resolved.

## Riscos reais

- **Superseder G08 / abrir spec** (Alto): reabre decisão Resolved da owner; é o blank-slate temido.
- **Reabrir artefatos canônicos (E1)** (Médio): "spec/plan/tasks ainda fazem sentido?" pode
  escalar para reescrever tudo — manter como "permanecem SSOT-views".
- **Over-modeling do grafo** (Médio): nó/aresta para cada candidata; mitigado por §5.3 do compilado.
- **Banco virar 2ª SSOT** (Alto se mal feito): mitigado por snapshot derivado + check de drift + derived-only.
- **H3 virar etapa gigante** (Médio): começar por DEC + falsificação de valor, não por "value engine".

## O que NÃO implementar ainda

Motor de grafo operacional; Neo4j/qualquer banco; simulador navegável; migração de templates;
nova spec/frente/repo; supersede de G08; edição de `state.yml`/`tasks.md`/`plan.md`/`decision-brief.md`
a partir só deste research; substituir dogfood por fixtures sem contrato/critério de equivalência.

## Próximo artefato mínimo

Este audit. Depois, **se** a owner aprovar, a **DEC companheira G23** estendendo G08 para H3+H4
(derived-only, sem 2ª SSOT). Nada além disso até decisão governada.
