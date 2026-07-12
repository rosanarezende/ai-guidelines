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
