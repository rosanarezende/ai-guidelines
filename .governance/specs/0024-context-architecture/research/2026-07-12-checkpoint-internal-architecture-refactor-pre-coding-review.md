---
artifact-kind: pre-coding-review
subject: "Modelo de reorganização behavior-preserving de src/cli + forma do grafo operacional e contrato do graph snapshot derivado (checkpoint internal-architecture-refactor-ddd-bdd, PR #46)"
date: 2026-07-12
reviewer: internal
method: falsification
disposition: living
---

# Pre-coding review — refactor interno DDD/BDD (PR #46)

> **Autoridade:** advisory (`artifact-kind: pre-coding-review`, DEC-0024-G24). Findings
> daqui só governam quando promovidos a DEC/task/review governado. O sujeito é o
> **modelo/desenho do refactor**, antes de codar — não a entrega.

## 1. Sujeito

Revisar, antes de mover qualquer arquivo, o modelo de reorganização do runtime
(`src/cli` e testes) e as duas decisões de arquitetura roteadas para este
checkpoint por `[DEC-0024-G23]`/`[DEC-0024-G28]`:

1. a **forma do grafo de governança operacional** (estender `KnowledgeGraph` ×
   novo bounded context × read-model acima de contexts);
2. o **contrato do graph snapshot derivado** (nodes/edges/source-refs/hashes;
   determinístico, regenerável, offline; derived-only, sem 2ª SSOT).

## 2. Base factual (inventário)

- `src/cli` tem **108 módulos flat** na raiz + 8 subdiretórios (`copy/`,
  `decide/`, `delivery/`, `experience/`, `flow/`, `registry/`, `repair/`,
  `visual-prompts/`). A raiz mistura: entrypoints de comando, derivações puras
  (`handoffFacts`, `reviewRequirements`, `prReadyCheck.evaluate*`), checks,
  projeções (`governedWorkMap`), gateways gh/git e copy.
- As camadas `src/domain` (12 contexts), `src/app` (ports/projections/services/
  use-cases/workflow) e `src/infrastructure` (adapters por tecnologia) **já
  existem** e estão razoavelmente coesas. O débito de legibilidade está
  concentrado na superfície `src/cli`.
- **Violações de fronteira hoje (baseline factual, corrigida pelo próprio guard
  da fatia 1):** 7 entradas em 6 arquivos —
  `app/constraints/RegistryCommandSurfaceResolver.ts -> cli` (produção; importa
  `RegistryCommandDescriptor` de `cli/registry/describeCommands`),
  `app/constraints/compileConstraints.test.ts -> cli`,
  `app/constraints/surfaceResolvers.test.ts -> cli`,
  `infrastructure/ast/SkipGuard.test.ts -> cli` (importa `discoverTestFiles` de
  `cli/livingDocs`), `domain/templates/TasksEvidenceDrivenEquivalence.test.ts ->
app` e `-> infrastructure`, e `domain/workspace/WorkspaceDiscovery.test.ts ->
app`. As três últimas só apareceram quando o guard automatizado rodou —
  evidência direta de PCR-F2 (a fronteira sobrevivia por disciplina; o grep
  manual inicial só cobria `→ cli`). Não havia guard de camadas antes (só
  `NoMonolithResidue`).
- Consumidores rígidos da estrutura atual: `package.json#bin → dist/cli/main.js`,
  script-contracts (`node dist/cli/bin.js …`), pointers `.mjs` que importam
  `dist/cli/*`, help derivado do `CommandRegistry`, e o site build.

## 3. Modelo proposto (para falsificação)

**Direção:** não criar camadas novas; **completar as existentes**. `src/cli`
vira superfície fina (parse/IO/apresentação); derivações puras descem para
`src/app` (por família: reviews, readiness, handoff, continuation, work-map);
tipos de contrato descem para `src/domain`. Movimentos por família, um por
commit, com `git mv` + atualização de imports e ZERO mudança de comportamento.

**Forma do grafo operacional (G23) — recomendação:** read-model derivado ACIMA
dos contexts, como novo módulo de projeção em `src/app/projections/`
(padrão-irmão do `KnowledgeGraph`, sem estendê-lo — o `KnowledgeGraph` é
knowledge-only e estendê-lo acoplaria dois ciclos de vida diferentes; um bounded
context novo seria peso especulativo sem persistência própria). O grafo
operacional consome `state.yml`/`tasks.md`/reviews/gates já parseados e projeta
nodes/edges tipados.

**Contrato do snapshot (esboço a validar na implementação):**
`governance-graph-snapshot.json` derivado, com `schema_version`, `nodes[]`
(id/kind/labels/source_ref), `edges[]` (from/to/kind/source_ref),
`source_refs[]` (path + content hash) e `snapshot_fingerprint` (hash do
conjunto canônico serializado — mesmo padrão de selo dos reviews). Regenerável
offline por comando (`governance-graph:build`/`:check`, espelhando o par do
`governed-work-map`). Nunca lido como fonte por comando decisório.

## 4. Falsificação (o que quebraria / o que protege)

| Risco                                                             | Proteção                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mover módulo importado por `dist/cli/bin.js`/pointers `.mjs`      | `script-contracts:check` + `test:smoke` sobre tarball; mover entrypoints por último              |
| Import quebrado em teste espelhado                                | `npm run build` + suíte jest completa por fatia                                                  |
| Help/registry divergir após moves                                 | help é derivado do `CommandRegistry` (SSOT); testes do registry                                  |
| Snapshot virar 2ª SSOT                                            | check de derivação (build+compare, como `governed-work-map:check`); comando decisório nunca o lê |
| Regressão silenciosa de fronteira durante o refactor              | **fatia 1**: guard de camadas com baseline congelada (falha em violação NOVA)                    |
| Selos/fingerprints mudarem por reformatação acidental de artefato | fatias não tocam `.governance/`; `review:check` no validate                                      |

## 5. Aprendizados estruturais do work-graph-model (matriz Guilda)

Aplicáveis ao framework neste checkpoint: identity ≠ authority ≠ content
(QRDs 08-11) → nomear fronteiras de módulo por autoridade, não por tecnologia;
read-models derived-only (QRDs 12-16) → contrato do snapshot; adapters como
evidence/importer/projection (QRDs 17-23/30-33) → ports em `app/ports`;
contratos de teste guiando estrutura (QRDs 34-35) → BDD de mantenedor por
família movida. Fora (repo Guilda): UX/app/desktop/portal/auth/branding/matcher.

**Rastreabilidade lente a lente (não narrativa):** a disposição completa das 9
lentes do tracker (macro→micro; aplicada/roteada/migrada/evidência/rebaixada,
com destino no snapshot e na falsificação) vive em
[`2026-07-12-checkpoint-internal-architecture-refactor-work-graph-lens-matrix.md`](./2026-07-12-checkpoint-internal-architecture-refactor-work-graph-lens-matrix.md)
— critério de saída do checkpoint, verificado na `continuation-review-human-gate`.
A matriz também rastreia o **`model.yml` v3 (SSOT normativo)** entidade a
entidade/aresta a aresta (§§5-7) e consolida em **§8 o contrato implementável do
graph snapshot** — nós, arestas, atributos derivados, source_ref/fingerprint e o
que fica fora por ser política. A fatia 4 deste plano implementa CONTRA o §8.

## 6. Fatias propostas (ordem de execução)

1. **Guard de fronteira de camadas** (esta rodada): teste arquitetural que
   proíbe `domain→{app,infrastructure,cli}`, `app→cli`, `infrastructure→cli`,
   com **baseline congelada** das 4 violações existentes (falha só em violação
   NOVA; zero mudança de runtime). Rede de segurança antes de mover.
2. **Descer derivações puras por família** (reviews → readiness → handoff →
   continuation), um commit por família, jest verde em cada.
3. **Resolver as 4 violações da baseline** (mover `RegistryCommandDescriptor`
   para `domain/registry` ou `app`; `discoverTestFiles` para infra) e esvaziar a
   baseline do guard.
4. **Grafo operacional + snapshot** (projeção em `app/projections` + comandos
   build/check + contrato testado: determinismo, regenerabilidade, offline).
5. **Disposição da gramática G01 remanescente** + disposição item a item da
   matriz Guilda (aplicado/migrado/legado/rebaixado) — critérios de saída G28.

## 7. Findings (advisory)

- **PCR-F1 (médio):** `app/constraints/RegistryCommandSurfaceResolver.ts`
  importa tipo da CLI em produção — inversão de dependência pendente (fatia 3).
- **PCR-F2 (baixo):** não existe guard automatizado de camadas; a fronteira
  DDD atual sobrevive por disciplina, não por enforcement (fatia 1 resolve).
- **PCR-F3 (baixo):** `descriptionFromRawText` (GovernedFlow) usa marcador
  ingênuo `**<id> — <title>**` com fallback gracioso; degrada cosmético quando o
  título usa prefixo `Checkpoint ` — candidata a absorver na fatia 2 da família
  flow (mesma família do bug corrigido em `stepDeliveryEvidence`).
