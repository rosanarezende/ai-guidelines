---
artifact-kind: inventory
subject: "Matriz de rastreabilidade: lentes macro→micro do work-graph-model → framework ai-guidelines (checkpoint internal-architecture-refactor-ddd-bdd, PR #46)"
date: 2026-07-12
disposition: living
---

# Matriz de rastreabilidade — lentes do work-graph-model no framework

> **Autoridade:** nenhuma (`artifact-kind: inventory` — mapa de conceitos/fontes/
> gaps; em divergência vencem `state.yml`/`tasks.md`/DECs). **Propósito:** cumprir
> `[DEC-0024-G28]` sem frase genérica — cada lente do incubador tem disposição
> rastreável: **aplicada** ao framework, **roteada** (este PR / falsificação /
> review final), **migrada** à Guilda, **evidência histórica** ou **rebaixada**.
> Fontes: `work-graph-model/tracker.md` (9 lentes), `model.yml` (SSOT normativo
> do modelo), `features.md`, `GUILDA-QRD-PRESERVATION-MATRIX.md`.

## 1. As lentes preservadas (macro → micro)

O tracker organiza 9 lentes do mais amplo ao mais primitivo. A leitura
macro→meso→micro do framework mapeia assim:

- **Macro (sistema/direção):** L1 propósito/princípios · L2 fluxo da iniciativa
  → no framework: Spec/Frente/Checkpoint (DEC-G22), topologia de `state.yml`,
  lifecycle governado (`frenteProgression`).
- **Meso (contêineres de trabalho/revisão):** L3 famílias · L4 dimensões ·
  L5 lifecycles → no framework: PR/review/gate/continuation package/projeções
  (`artifact-kind`+`disposition`, `review_plan`, `governed-work-map`).
- **Micro (primitivos):** L6 grafo/arestas · L7 camadas físicas/identidade ·
  L8 envelope transacional · L9 fronteiras de confiança → no framework:
  task/finding/decision/event/source-ref/selo/fingerprint e o **contrato do
  graph snapshot derivado** (critério G23 deste PR).

## 2. Matriz por lente

Colunas: **Perguntava** (no work-graph-model) · **Informa** (parte do framework)
· **Mora/deve morar** · **Snapshot?** (entra no graph snapshot derivado) ·
**Falsificação?** · **Disposição**.

| Lente                               | Perguntava                                                                                                            | Informa no framework                                                                                                                         | Mora / deve morar                                                                                                                                                              | Snapshot?                                              | Falsificação?                                                                                                                                    | Disposição                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **L1 · Propósito/princípios**       | Como modelar trabalho como grafo tipado file-first, banco derivado, advisory-não-decide?                              | Toda a arquitetura de projeções: repo=SSOT, derivado nunca decide, humano fecha gate                                                         | APLICADO: `state.yml`+artefatos governados (SSOT); `governed-work-map`, handoff, `frenteProgression` (derivados); `decide` (humano)                                            | SIM — é a tese do snapshot (derived-only, DEC-G23)     | Prova de valor → `broad-flow-falsification` (DEC-G23)                                                                                            | **Aplicada**                                                                                                           |
| **L2 · Fluxo da iniciativa**        | registro→triagem→gate→ativação→breakdown; gate humano append-only; stale-invalidation                                 | Lifecycle governado: continuation prepare→create-pr; Human Gate; freshness/staleness                                                         | APLICADO em parte: gates append-only (`gates/`+eventos), `continuation:*` (DEC-G27), selos/freshness; **gramática G01 restante = critério de saída DESTE PR**                  | Nós/arestas de lifecycle (gate, evento, continuação)   | Jornadas de fluxo → `broad-flow-falsification`                                                                                                   | **Aplicada (parcial) + roteada: G01 neste PR**                                                                         |
| **L3 · Famílias/taxonomia**         | Qual a natureza da saída de cada nó? (capacidade/aprendizado/resposta/intake/deliberação)                             | `artifact-kind` (natureza de documento, PR #45) e `WorkItemKind` 7-MECE (ADR 0010)                                                           | FECHADO no PR #45 (`artifact-taxonomy.yml` + check); promoção de work-items (G03) roteada                                                                                      | Tipos de nó do snapshot nascem compatíveis (DEC-G23)   | Pipeline G03 → `broad-flow-falsification` (DEC-G28)                                                                                              | **Aplicada (artefatos) + roteada: G03 → falsificação**                                                                 |
| **L4 · Dimensões ortogonais**       | O que corta as famílias sem virar tipo? Dimensão sem enforcement é tag decorativa                                     | `disposition` ortogonal ao kind (DEC-G24); `review_plan` (recomendação ≠ decisão); EnforcementBinding (PIT-0008/ADR 0021)                    | APLICADO: `.core/governance/artifact-taxonomy.yml`, `state.yml § review_plan`, `constraints`                                                                                   | Como atributos de nó, não tipos                        | Enforcement real de dimensões → já coberto por checks; sem pendência                                                                             | **Aplicada**; presets humanos de UX → **migrada (Guilda)**                                                             |
| **L5 · Ciclos de vida**             | 5 momentos comuns; bloqueado/pausado DERIVADOS, nunca gravados; readiness explícita                                   | Estados derivados do handoff (stale/blocked); `STEP_READINESS` como marcador explícito; `frenteProgression.activeStepReady`                  | APLICADO: `src/app/handoff` + `src/app/workflow/frenteProgression.ts` + pr-ready (paridade)                                                                                    | Estados derivados = atributos derivados do snapshot    | Jornadas de lifecycle não-óbvias → `broad-flow-falsification`                                                                                    | **Aplicada**                                                                                                           |
| **L6 · O grafo (arestas)**          | Conjunto FECHADO de arestas, critério único, anota 1 lado, reverso derivado                                           | **O contrato do graph snapshot deste PR**: nodes/edges tipados, conjunto fechado, derivação do reverso                                       | DEVE MORAR: `src/app/projections/` (irmão do `KnowledgeGraph`, sem estendê-lo — pre-coding-review §3); `KnowledgeRef`/`constrains` já existem                                  | **É o núcleo do snapshot** (critério de saída G23/G28) | Determinismo/regenerabilidade/offline = testes do contrato                                                                                       | **Roteada: ESTE PR (fatia 4 do plano)**                                                                                |
| **L7 · Camadas físicas/identidade** | GlobalRef estável (`family:ns/id@rev`); `context.json` com envelope (schema/hash/origem); contrato como nó versionado | `source_refs` do snapshot (path+hash) e `snapshot_fingerprint` — mesmo padrão dos selos de review/handoff                                    | APLICADO no padrão de selos; source-ref do snapshot DEVE MORAR no contrato (fatia 4); host cross-repo = spike futuro (DEC-G23 defere banco/identidade cross-repo)              | SIM — define a FORMA de source-ref/fingerprint         | Regeneração idempotente do snapshot                                                                                                              | **Aplicada (selos) + roteada: source-refs neste PR; cross-repo → spike futuro**; matcher → **migrada (Guilda)**        |
| **L8 · Envelope transacional**      | Toda mutação carrega actor/authority/base-revision/idempotency; append-only; conflito detectável                      | Selos+fingerprints+eventos append-only+recibo de carga (aplicado); transação file-first completa (lock/replay/recovery) provada na incubação | APLICADO em parte (`review:seal`, eventos, recibo); runtime transacional completo = **evidência histórica** (`_archive/`), runtime vivo pertence à Guilda                      | Fingerprint do snapshot herda o padrão                 | Corrida/stale nos comandos mutantes do framework → candidata em `broad-flow-falsification` (não bloqueia este PR)                                | **Aplicada (parcial) + evidência histórica (runtime completo)**                                                        |
| **L9 · Fronteiras de confiança**    | Envelope prova quem declarou, não que é verdade; egress por classificação; agente delegado formal; anti-gaming        | Autorização capability-scoped dos reviews (publication policy); "IA só abre Draft, humano decide" (DEC-G27); anonimização acme-\*            | APLICADO nos guardrails de autorização; `_red-team-corpus/` preservado como **evidência histórica**; políticas normativas de produto (threat-model/egress/delegation) → Guilda | NÃO (política, não estrutura)                          | Input hostil no plano de governança = candidata explícita em `broad-flow-falsification`; se não entrar, **rebaixar por decisão** na review final | **Aplicada (guardrails) + migrada (políticas de produto) + evidência (corpus) + roteada: input hostil → falsificação** |

## 3. Consolidação por disposição (sem "aprendizados considerados")

- **Aplicado ao framework (já em código/contrato):** L1 integral; L2 gates
  append-only + continuação governada + freshness; L3/L4 via PR #45
  (`artifact-kind`/`disposition`) e `review_plan`; L5 integral
  (`frenteProgression` + paridade pr-ready/humanGate); L7 padrão de selos;
  L8 selos/eventos/recibo; L9 autorização capability-scoped + Draft-só-com-humano.
- **Roteado para ESTE PR (critérios de saída, não narrativa):** L2 gramática
  operacional remanescente de `G01`; L6 contrato do snapshot (nodes/edges,
  conjunto fechado, derivação de reverso); L7 forma de source-ref/fingerprint
  do snapshot.
- **Roteado para `broad-flow-falsification`:** prova de valor (L1/DEC-G23);
  jornadas de fluxo e lifecycle (L2/L5); pipeline de promoção G03 (L3/DEC-G28);
  corrida/stale em comandos mutantes (L8); **input hostil no plano de
  governança** (L9 — nova candidata explícita registrada aqui).
- **Roteado para `continuation-review-human-gate`:** verificar que cada linha
  desta matriz foi cumprida, rebaixada por decisão ou segue bloqueando (critério
  DEC-G28 aplicado à matriz, não a uma frase).
- **Migrado para Guilda (não reativar aqui):** presets de UX (L4), matcher e
  espectro léxico→LLM (L7), políticas normativas de produto e portal (L9),
  runtime transacional vivo (L8).
- **Evidência histórica (arquivo, não fonte):** `_archive/guilda-incubation-2026-07/`
  (runtime file-first provado, app, spikes), `_red-team-corpus/`, `_audits/`
  rodadas 3-4 (que originaram L8/L9).
- **Aberto (decisão ainda não tomada):** nenhum item desta matriz fica sem casa;
  o único condicional é L9-input-hostil, que entra na falsificação OU é rebaixado
  por decisão explícita na review final — nunca por esquecimento.

## 4. Findings de re-derivação (critério "derivação canônica; superfícies renderizam")

- **LENS-F1 (médio):** `src/cli/decide/advanceEligibility.ts` re-deriva estado de
  etapas com semântica posicional própria (`pendingBefore`/`pendingAfter` por
  `line`) — pergunta mais rica que a atual `frenteProgression` responde.
  Correção não é fatia pequena/segura: consolidar exige estender o modelo
  canônico com ordem posicional. **Próxima fatia do refactor.**
- **LENS-F2 (baixo):** `src/app/handoff/handoffFacts.ts` (resolução interna de
  etapa, linhas ~441/502) mantém filtros locais equivalentes — candidato a
  consumir `frenteProgression` na mesma fatia de LENS-F1.
- **LENS-F3 (baixo):** `descriptionFromRawText` (GovernedFlow) usa marcador
  ingênuo com fallback gracioso (= PCR-F3 do pre-coding-review; degrada só
  cosmético). Absorver na fatia da família flow.

## 5. Alinhamento normativo com o `model.yml` v3 — ENTIDADES

> O tracker é embasamento; o **`model.yml` v3 limpo é o SSOT normativo do
> modelo**. Esta seção rastreia entidade a entidade (não "inspirado em"). O
> snapshot do PR #46 projeta **o trabalho governado do próprio framework**
> (state.yml/tasks/DECs/reviews/gates), tipado de forma COMPATÍVEL com o
> modelo (DEC-G23: uma taxonomia, não duas) — ele NÃO implementa o grafo
> org-scale, que é produto Guilda.

Colunas: **Contraparte no framework** · **Snapshot?** (agora/depois/nunca) ·
**Lente** · **Disposição**.

| Entidade normativa (`model.yml`)                                                                               | Contraparte no framework                                                                                                         | Snapshot?                                                                      | Lente | Disposição                                                                |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------- |
| `intent` (approach/signal/gate de ativação)                                                                    | Trabalho governado (objetivo durável com gate de research/ativação em `state.yml § gate`; invólucro físico legado = "spec", G25) | **AGORA** — nó `governed-work` (§8.0)                                          | L2    | Aplicada como contraparte; semântica approach/signal = conceito (§7)      |
| `execution-unit` (8 kinds, collapse-rule)                                                                      | Nó topológico/PR (`state.yml § topology.prs[]` — unidade com lifecycle próprio)                                                  | **AGORA** — nó `topology-node` (PR)                                            | L2/L6 | Aplicada; kinds ricos (experiment-run etc.) = conceito → G03/falsificação |
| `repo-work` (purpose: create/sustain/discover/operate)                                                         | Checkpoint/Etapa (peça executável; `tasks.md` steps)                                                                             | **AGORA** — nós `checkpoint` e `step`                                          | L2/L5 | Aplicada; `purpose` 4-valores = conceito compatível com WorkItemKind      |
| `contract` (nó versionado; compatibility-window)                                                               | Contratos operacionais do framework: `script-contracts.yml`, `PrProfileContract`, policies                                       | **DEPOIS** — quando o snapshot cobrir contratos operacionais                   | L6/L7 | Roteada (pós-#46); nó versionado como conceito aplicado nos contracts     |
| `deliberation` (q/r/d anexável)                                                                                | `decision-brief.md` (DEC) + `research/` (q/r/d é o coração do framework)                                                         | **AGORA** — nós `decision` e `research-artifact` (com kind)                    | L3    | Aplicada                                                                  |
| `intake` (proposal/register)                                                                                   | `roadmap/backlog` + insights (PIT) + continuação (`continuations/`)                                                              | **AGORA** parcial — nó `insight` e `continuation-package`                      | L2    | Aplicada (parcial); funil rico de register/triagem = Guilda               |
| `assisted-authoring` (advisory-only, no-silent-write)                                                          | Briefings `flow work/review/decide` (projetam contrato; humano confirma)                                                         | NÃO (é lei de conduta, não nó)                                                 | L1    | Aplicada como lei das superfícies                                         |
| `business-objective` recursivo · `thesis` · `opportunity-area` · `metric-definition` · `target` · `allocation` | Sem contraparte no framework hoje (prova de valor ainda não modelada)                                                            | **DEPOIS** — só se a prova de valor (DEC-G23/H3) virar entidade                | L1    | Roteada → `broad-flow-falsification` decide se materializa                |
| `outcome` (append-only; único insumo de actual)                                                                | Gate decision + release-log (resultado governado append-only)                                                                    | **AGORA** — nó `gate`; release-log DEPOIS (encerramento do trabalho governado) | L2/L5 | Aplicada (gate)                                                           |
| `repo` · `repo-context` (`publishes-context`)                                                                  | O próprio repositório + projeções publicadas (`active.yml`, `governed-work-map`, handoff)                                        | **AGORA** — nó `projection` (derivado, nunca SSOT)                             | L7    | Aplicada                                                                  |
| `repo-work-ack` · `repo-contract` · `code-touchpoint`                                                          | Sem contraparte multi-repo hoje; `code-touchpoint` ≈ `source_ref` do snapshot                                                    | `source_ref` **AGORA**; acks cross-repo = spike futuro (DEC-G23)               | L7    | Roteada (source_ref neste PR) + evidência (acks provados na incubação)    |
| Reviews/findings/gates do framework (sem par no model)                                                         | `reviews/*.yml`, findings, resolutions, events, `gates/*.yml`                                                                    | **AGORA** — nós `review`/`finding`/`resolution`/`review-event`                 | L8    | Aplicada (já existem com selos; o snapshot os projeta)                    |

## 6. Alinhamento normativo — ARESTAS

| Aresta (`model.yml`)                                                                   | Contraparte no framework (aresta do snapshot)                                      | Snapshot?                                               | Lente | Disposição                                        |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- | ----- | ------------------------------------------------- |
| `breaks-into` (intent → unit/repo-work)                                                | `governed-work —contains→ topology-node` (§8.0)                                    | **AGORA**                                               | L6    | Aplicada                                          |
| `contains` (unit → repo-work)                                                          | `topology-node —contains→ checkpoint —contains→ step`                              | **AGORA**                                               | L6    | Aplicada                                          |
| `delivery-after` (paraleliza, bloqueia entrega)                                        | Stack de PRs (`sequence` contígua; base/head) — entrega só no terminal (modo unit) | **AGORA** — `topology-node —stacked-on→ topology-node`  | L6    | Aplicada                                          |
| `blocked-by`/`blocks`                                                                  | `frenteProgression` (derivado de steps) + findings bloqueantes                     | **AGORA** como aresta **DERIVADA**                      | L5/L6 | Aplicada (derivada, nunca gravada)                |
| `coordinates-with` (→ contract)                                                        | Consumo de script-contracts/policies                                               | DEPOIS (junto do nó contract)                           | L6    | Roteada pós-#46                                   |
| `results-in`/`derives-from` · `raises`                                                 | Continuação governada (PR #45 →continuation→ PR #46); insight →raises→ trabalho    | **AGORA** — `continues-from` entre nós; `raises` DEPOIS | L2    | Aplicada (continuação)                            |
| `answers` · `supported-by`                                                             | q/r/d: research →supports→ DEC (`decision-brief` cita research)                    | **AGORA** — `decision —supported-by→ research-artifact` | L3    | Aplicada                                          |
| `emits` (→ outcome) · `closed-by`                                                      | `checkpoint —closed-by→ gate`; review-event fecha lane (DEC-G29)                   | **AGORA**                                               | L5/L8 | Aplicada                                          |
| `supersedes` (decision→decision, append-only)                                          | DECs supersedem DECs (ex.: G25 sobre G22); events append-only                      | **AGORA** — `decision —supersedes→ decision`            | L6    | Aplicada                                          |
| `occurred-during` · `caused-by` (incident)                                             | Sem incidente modelado no framework hoje                                           | NUNCA neste PR                                          | L3    | Rebaixada p/ framework (produto/ops = Guilda)     |
| `publishes-context` (repo → repo-context)                                              | `state.yml —projects→ {governed-work-map, active.yml, handoff, snapshot}`          | **AGORA** — aresta `derived-from`                       | L7    | Aplicada (é a definição do próprio snapshot)      |
| `acknowledges-work` · `backs-contract` · `evidenced-by`                                | `evidenced-by` ≈ `source_ref` (path+hash) de cada nó do snapshot                   | `source_ref` **AGORA**; acks = spike                    | L7/L8 | Roteada (source_ref) + evidência histórica (acks) |
| Business: `authorizes`/`measured-by`/`contributes-to`/`cascades-to`/`aligns-with` etc. | Sem contraparte (prova de valor não modelada)                                      | DEPOIS (se H3 materializar)                             | L1    | Roteada → falsificação decide                     |

## 7. Conceitos normativos recentes (fechados no v3)

| Conceito                                                                            | Situação no framework                                                                                                                                             | Disposição                                                                                                                      |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `intent.approach = validate-first \| direct`                                        | Conceito compatível com spike/experiment × implementação direta (WorkItemKind); não vira campo do snapshot agora                                                  | Conceito aplicável; materialização → G03/falsificação                                                                           |
| `signal = none \| touches-contract \| operational-target`                           | Análogo aos triggers de smoke/consumer-paths do `pr-ready` (mudança que toca contrato exige validação extra) — já aplicado em espírito                            | Aplicada (análogo); campo formal = depois                                                                                       |
| `execution-unit` kinds finais + `discovery` (fate)                                  | Kinds ricos pertencem ao trabalho org-scale; `discovery` ≈ spike/research com fate (throwaway/promoted/parked) ≈ promoção de research (PR #45)                    | Conceito; pipeline de promoção → `broad-flow-falsification`                                                                     |
| `collapse-rule` (unit colapsa no trivial)                                           | Aplicada estruturalmente: checkpoint sem etapas; PR único sem sub-decomposição; `scaling-law` ≈ "cerimônia proporcional" (perfis solo/contributor/team)           | **Aplicada** (scaling-law ≙ review-policy profiles)                                                                             |
| Estados derivados `blocked/paused/stale/invalid`                                    | JÁ APLICADO: stale de reviews/receitas, blocked derivado (`frenteProgression`), invalid = seal quebrado (`review:check`)                                          | **Aplicada** — snapshot os expõe como atributos DERIVADOS                                                                       |
| Envelope `actor/authority/base-revision/idempotency/nonce/issued-at/schema-version` | Parcial: reviews/gates têm executor/actor, subject_ref (≈base-revision), fingerprints (≈idempotency), date, schema_version. **nonce**: só no runtime da incubação | Aplicada (parcial); nonce+mutation-types = evidência histórica (runtime Guilda); forma do `snapshot_fingerprint` herda o padrão |
| `unknown-mutation: fail-closed`                                                     | Aplicado como postura (checks fail-closed; degradação explícita)                                                                                                  | **Aplicada**                                                                                                                    |
| `trust` (boundary, 3 laws) · `policy-artifacts`                                     | "Independência: enforça-se quem verifica" = SoD do review (reviewer ≠ implementer; disposition só reviewer/owner) — APLICADO. Artefatos de política = produto     | Aplicada (SoD) + migrada (policy-artifacts) + evidência (red-team-corpus)                                                       |
| `governance-profiles` (full/compact/solo)                                           | **Contraparte direta**: `review-policy.yml § profiles` (team/contributor/solo) — mesma lei de cerimônia proporcional                                              | **Aplicada** (mapeamento 1:1 já existente)                                                                                      |
| `decision-points` (approve/activate/rollout/verdict)                                | Human Gate + `flow decide` (briefing → confirmação → registro; append-only)                                                                                       | **Aplicada** (gate genérico; points ricos = Guilda)                                                                             |
| `schema-policy` (zod; validação runtime em fronteira pública)                       | O próprio model.yml manda: "schemas executáveis do produto vivem no repo Guilda"                                                                                  | **Migrada (Guilda)** por decisão do SSOT                                                                                        |

## 8. Contrato do graph snapshot — consolidado implementável

Derivado dos §§5-7 (implementável sem voltar à conversa).

### 8.0 Vocabulário: conceitual (canônico) × físico (legado)

Por `[DEC-0024-G25]`, **"Spec" é invólucro histórico e caminho físico, não
centro conceitual das projeções vivas** — a linguagem viva é **trabalho
governado** e **work graph** (precedente: `governed-work-map:*`, "Mapa Vivo do
Trabalho Governado"). Consequências normativas para o snapshot:

- **Canônicos como `node.type`:** `governed-work` (o invólucro do trabalho
  governado — antes "spec") · `topology-node` (nó de `state.yml § topology`,
  vocabulário canônico da SSOT estrutural; o PR do GitHub é ATRIBUTO
  `github_pr`, não o tipo — ADR 0025) · `checkpoint` · `step` (Etapa) ·
  `task` (Tarefa, folha de `tasks.md`) · `decision` (DEC) · `adr` ·
  `guardrail` (GG) · `insight` (PIT) · `review` · `finding` · `resolution` ·
  `review-event` · `gate` · `continuation-package` · `research-artifact` ·
  `projection` — todos já são vocabulário decidido (G22/G24/G26/G27/ADR 0010/0025).
- **PROIBIDOS como `node.type` novo:** `spec` (G25) · `frente` (G22: Frente é
  **leitura humana DERIVADA** de um conjunto de nós, não entidade — materializá-la
  como nó criaria a 2ª topologia que a G22 veta; pode existir como AGRUPAMENTO
  derivado/rotulagem de projeção, nunca como nó com identidade própria) ·
  qualquer nome de path físico (`pr-bodies`, `specs`).
- **Compatibilidade legada PERMITIDA como atributos do nó `governed-work`:**
  `legacy_spec_id: "0024"` · `legacy_spec_slug: "context-architecture"` ·
  `source_path: ".governance/specs/0024-context-architecture"`. Flags
  `--spec 0024`, branches `feat/spec-NNNN-*` e o path `.governance/specs/`
  continuam válidos como superfície física/CLI (G25 não renomeia caminhos);
  o snapshot os registra em `source_ref`/atributos, nunca como tipo.
- **Trade-off registrado:** entre `governed-work`, `work`, `front`/`frente` e
  `governance-work`, adotado **`governed-work`** — é o menor ajuste consistente
  com o vocabulário já decidido (G25 "trabalho governado") e com o precedente de
  naming vivo (`governed-work-map`); `work` colide com o comando `flow work` e
  com `repo-work` do model.yml; `frente` é derivada (acima); `governance-work`
  seria nome novo sem decisão.

### 8.1 Nós (agora)

`governed-work` (atributos: `legacy_spec_id`, `legacy_spec_slug`, `source_path`,
stage, gate.status) · `topology-node` (atributos: `github_pr`, sequence, role,
terminal, status concluded/active/planned) · `checkpoint` · `step` · `task` ·
`decision` (DEC) · `adr` · `guardrail` (GG) · `insight` (PIT) · `review` ·
`finding` · `resolution` · `review-event` · `gate` · `continuation-package` ·
`research-artifact` (com `artifact-kind`) · `projection`.

### 8.2 Arestas (agora)

`contains` (governed-work→topology-node→checkpoint→step→task) · `stacked-on`
(topology-node→topology-node, base da stack) · `continues-from`
(topology-node→topology-node via continuação) · `verifies` (review→checkpoint;
review-event→finding/review) · `belongs-to` (finding→review) · `resolves`
(resolution→finding) · `closed-by` (checkpoint→gate) · `supersedes`
(decision→decision) · `supported-by` (decision→research-artifact) ·
`derived-from` (projection→governed-work).

### 8.3 Atributos derivados, selo e fronteira

- **Atributos derivados (nunca gravados):** saídas da `frenteProgression`
  (frenteComplete, nextTopologyExecutable, activeStepReady), freshness
  (current/stale), decisão efetiva de lane (DEC-G29), blocked/paused. O
  agrupamento "Frente" é derivável destes dados (G22), não um nó.
- **`source_ref`/hash/fingerprint:** cada nó carrega `source_ref` (path
  repo-relativo + content-hash) — análogo de `evidenced-by`/`code-touchpoint`;
  id estável inspirado em `GlobalRef` (`type:governed-work-id/node-id@rev`); o
  snapshot inteiro fecha com `snapshot_fingerprint` = hash de serialização
  canônica (mesmo padrão de `review_fingerprint`) + `schema_version`.
  **Políticas v1 FECHADAS (PR #46 — decisão, não adiamento):**
  (a) `generated-at`/`source-commit` FICAM FORA do snapshot **por design**:
  quebrariam o determinismo do par build/check (todo commit re-stale-aria o
  snapshot sem mudança de conteúdo). A rastreabilidade vem de
  `source_refs + content-hashes + snapshot_fingerprint` — não de timestamp/HEAD
  (equivalente determinístico do envelope L7; quem precisa do instante/commit
  usa o próprio git do artefato versionado).
  (b) **Fontes voláteis são normalizadas antes do hash**: o campo de relógio
  `updated_at` do `active.yml` (projeção runtime) é excluído do conteúdo hashado
  (`normalizeSourceContentForHash`) — publish-state não gera churn de
  fingerprint; qualquer campo SEMÂNTICO (branch, stage, status) segue hashado e
  muda o selo. Testado nos dois sentidos.
  (c) **Task ids são estáveis por CONTEÚDO** (`sha12` do texto normalizado +
  ordinal por ocorrência para duplicatas), não por número de linha — mover a
  tarefa no arquivo preserva a identidade; `line` permanece como atributo
  humano. Testado (deslocamento de linhas não muda ids).
  `supersedes` (decision→decision) permanece tipo PERMITIDO com emissão ADIADA:
  o decision-brief não tem marcador machine-readable confiável (prosa contém
  negações como "sem superseder"); candidato a campo explícito.
- **Fora do snapshot (política/conduta):** trust laws, egress/threat-model,
  mutation-types do envelope, assisted-authoring laws, schema-policy.
- **Invariante dura:** derived-only e regenerável offline; nenhum comando
  decisório LÊ o snapshot como fonte (DEC-G23; `governed-work-map:check` é o
  precedente do par build/check).
