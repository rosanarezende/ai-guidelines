<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=7 (spec-0021-grade, copy/paste ready) -->

# Tasks — Spec 0021 Governance Information Architecture — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)  
> Plan: [`./plan.md`](./plan.md)  
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)  
> Status: In Progress (Stage 2)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 “Decisões revisitadas” e ajustar tasks impactadas.  
> **Rastreabilidade total:** toda fase/sub-bloco deve estar ancorado em `[DEC-0021-*]` (decision-brief).  
> **Harness Lock:** nenhuma fase avança sem validação humana + técnica (CORE-12/CORE-14).

---

## 📌 Invariantes não negociáveis (contrato do gate)

**Âncoras:** `[DEC-0021-A01]`, `[DEC-0021-A02]`, `[DEC-0021-A03]`, `[DEC-0021-B01]`, `[DEC-0021-B02]`, `[DEC-0021-B03]`, `[DEC-0021-B04]`, `[DEC-0021-B05]`, `[DEC-0021-C01]`, `[DEC-0021-D01]`

1. **Repo-first híbrido:** YAML versionado no repo como SSOT; Markdown apenas derivado; projeções futuras (DB/dashboard) só como derivados. `[DEC-0021-A01]`
2. **Pilares MECE como origem de valor:** `spec`, `exploration`, `fix`, `patch`, `incident`, `proposal`, `experiment`. `[DEC-0021-A02]`
3. **Root do consumidor:** `.governance/` como root unificado; `registry.yml` visível na raiz. `[DEC-0021-A03]`
4. **Recorte:** Fases 1–3 entregues; Fases 4–5 apenas mapeadas (sem produto/DB/dashboard). `[DEC-0021-B01]`
5. **Placement/lar futuro:** reservar lar canônico para intake/PRD, handoff, telemetria. `[DEC-0021-B02]`
6. **Carrier híbrido:** catálogo curto + reorganização física dirigida. `[DEC-0021-B03]`
7. **Foundation vs ADR:** fronteira híbrida explícita; foundation como constituição viva; ADR como decisões estáveis. `[DEC-0021-B04]`
8. **`.core/rules/` deve refletir taxonomia:** reorganização física dirigida alinhada ao runtime/builder. `[DEC-0021-B05]`
9. **DDD + TDD/BDD obrigatório:** re-arquitetura total da CLI; testes como SSOT. `[DEC-0021-C01]`
10. **Templates por composição atômica:** recipes + partials + validação estrutural; abandonar mirror legado só quando equivalente. `[DEC-0021-D01]`

---

## 📋 Estratégia de PRs — 5 Entregas Sequenciais (Harness Lock)

> **Rationale:** evitar mega-PR e também evitar micro-PR churn.  
> **Gate por fase:** cada PR (fase) precisa de branch dedicada, descrição temática, gate humano e cadeia de merge obrigatória.

| PR      | Fase   | Domínios focais                                                            | Status      |
| ------- | ------ | -------------------------------------------------------------------------- | ----------- |
| **PR0** | Fase 0 | Setup + Stage 1 (Research/Brief/Gate)                                      | ✅ Merged   |
| **PR1** | Fase 1 | DDD Core (Domain/Policy/Registry in-memory) + UseCases (sem IO real)       | [/] Active  |
| **PR2** | Fase 2 | Topology (GovernanceWorkspace Strangler Fig + RulesEngine builder/runtime) | [ ] Pending |
| **PR3** | Fase 3 | Intelligence (LivingDocumentation AST + TemplateEngine composition)        | [ ] Pending |
| **PR4** | Fase 4 | Consolidation (carrier/placement + foundation/ADR + legacy cleanup)        | [ ] Pending |

---

## 🔒 Bloco obrigatório de gerenciamento por PR (Harness Lock)

Cada fase **DEVE** conter (no próprio `tasks.md`) os itens abaixo:

### [PR-MGMT.NEW-BRANCH]

- Criar branch da fase a partir de `main` (assumindo fase anterior mergeada).

### [PR-MGMT.DESCRIPTION]

- Descrever em 6 seções:
  1. Decisões `[DEC-*]` impactadas
  2. Bounded contexts tocados
  3. Invariantes protegidas (e como)
  4. Riscos mitigados (hardcoded paths, drift, churn)
  5. Estratégia de rollback/escape hatch
  6. Como validar (comandos + evidências)

### [PR-MGMT.REVIEW-GATE]

- Checklist obrigatório:
  - [ ] Pipeline verde
  - [ ] Rastreabilidade `[DEC-*]` aplicada (sub-blocos e pontos críticos)
  - [ ] TDD/BDD com evidência de RED→GREEN (não só scaffolding)
  - [ ] Boundaries preservados (domain/app/infra)
  - [ ] Compatibilidade validada (quando aplicável)
  - [ ] Drift guard (quando aplicável)
  - [ ] Smoke tests (quando aplicável)

### [PR-MGMT.MERGE-CHAIN]

- Cadeia mínima:

```bash
yarn format
yarn check
yarn test:nova-cli
```

- Cadeias adicionais conforme fase:

```bash
yarn build:rules
yarn smoke
```

---

# ✅ Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> **Concluída.** Manter integralmente as fases já concluídas (Fase 0 e sub-blocos 1.0/1.A).
> **Âncoras:** todos os `[DEC-0021-*]` (gate fechado)

## Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** Bootstrap: ler `roadmap/backlog.md` e `.core/process/spec-foundation.md` § “Tipos de spec”.
- [x] **0.2** Tipo de spec confirmado como `evidence-driven` no header da `spec.md`.
- [x] **0.3** Slug semântico definido: `governance-information-architecture`.
- [x] **0.4** Branch `feat/spec-0021-governance-information-architecture` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado a partir do boilerplate; header completo com link para `decision-brief.md`.
- [x] **0.6** [MANDATÓRIO] Validação humana inicial: owner aprovou problema e escopo.
- [x] **0.7** `plan.md` instanciado com bloco Stage 1/Stage 2 e perguntas de research.
- [x] **0.8** `tasks.md` instanciado.
- [x] **0.9** `decision-brief.md` instanciado com `[DEC-0021-*]` em `Pendente`.
- [x] **0.10** `roadmap/backlog.md` atualizado: 0021 em execução.
- [x] **0.11** `NEXT.md` instanciado (mandatório).
- [x] **0.[COMMIT]** `chore(spec-0021): setup inicial da spec governance-information-architecture`.
- [x] **0.[PULL-REQUEST]** Criar PR em Draft.

## Sub-bloco [0.Research] — Stage 1: produzir researches

- [x] **0.R.1** Listar perguntas de research no `plan.md` cruzadas com `[DEC-0021-*]`.
- [x] **0.R.2** Consolidar pacote inicial de evidência (researchs 2026-05-08 + backlog).
- [x] **0.R.3** Produzir research complementar pós-gate (`post-gate-gap-analysis.md`).
- [x] **0.R.4** Incorporar débitos e implicações técnicas ao replanejamento do Stage 2.
- [x] **0.R.[COMMIT]** `research(spec-0021): sínteses Stage 1 publicadas`.

## Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md`

- [x] **0.B.1** Popular `[DEC-0021-A01..B05]` com opções e tradeoffs.
- [x] **0.B.2** Recomendações iniciais quando evidência convergente existir.
- [x] **0.B.3** Tabela resumo de status.
- [x] **0.B.4** Débitos iniciais registrados.
- [x] **0.B.[COMMIT]** `docs(spec-0021): decision-brief.md populado com opções Stage 1`.

## Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

- [x] **0.G.1** Owner revisou o `decision-brief.md`.
- [x] **0.G.2** Owner escolheu opções e fechou todos `[DEC-0021-*]` como `Resolved`.
- [x] **0.G.3** Perguntas que exigiram aprofundamento retornaram ao research antes do fechamento.
- [x] **0.G.4** Status agregado `Resolved` + bloco “Gate fechado”.
- [x] **0.G.5** `plan.md` passa a exigir v2.
- [x] **0.G.6** `tasks.md` passa a exigir v2.
- [x] **0.G.7** Replanejamento do Stage 2 aprovado pela owner.
- [x] **0.G.[COMMIT]** `docs(spec-0021): gate humano fechado — plan v2 + tasks v2 publicados`.
- [x] **0.G.[PULL-REQUEST]** PR atualizado com descrição Stage 1.
- [x] **0.G.[MANDATÓRIO]** Aprovação humana explícita para merge.

---

# 🚧 Fase 1 — Fundação Core (DDD Memory Layer) — PR1

> **Âncoras:** `[DEC-0021-A01]`, `[DEC-0021-A02]`, `[DEC-0021-C01]`
> **Objetivo:** fundar domínio/políticas/registry em memória + orquestração por casos de uso, sem acoplamento prematuro.

## [PR-MGMT] PR1

- [ ] **1.[PR-MGMT.NEW-BRANCH]** Branch: `feat/spec-0021-pr1-domain-memory-foundation`.
- [ ] **1.[PR-MGMT.DESCRIPTION]** (6 seções obrigatórias).
- [ ] **1.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório.
- [ ] **1.[PR-MGMT.MERGE-CHAIN]** `yarn format ; yarn check ; yarn test:nova-cli`.

## Sub-bloco [1.0] — Setup Técnico (TypeScript + Jest) ✅

> **Âncora:** `[DEC-0021-C01]` (mantido integralmente)

- [x] **1.0.[NEW-BRANCH]** Branch `feat/spec-0021-fase-1` criada a partir de `main` (PR0 mergeada).
- [x] **1.0.1** Dependências dev: `typescript`, `ts-node`, `jest`, `ts-jest`, `@types/node`, `@types/jest`.
- [x] **1.0.2** `tsconfig.json` ESM (`module: NodeNext`) e output `dist/`.
- [x] **1.0.3** `jest.config.ts` usando `ts-jest` e testes em `src/`.
- [x] **1.0.4** Scripts `test:nova-cli` e `build`.
- [x] **1.0.5** Smoke test (`src/smoke.test.ts`).
- [x] **1.0.N** Pipeline verde.
- [x] **1.0.6** Débitos: atualizar `NEXT.md`.
- [x] **1.0.[COMMIT]** `chore(spec-0021): setup typescript e jest para nova cli`.

## Sub-bloco [1.A] — Governança por Blueprints (Living Documentation) ✅

> **Âncoras:** `[DEC-0021-C01]`, `[DEC-0021-D01]` (mantido integralmente)

- [x] **1.A.1** Estruturar blueprints em `src/` (domain/app/infra).
- [x] **1.A.2** Enriquecer blueprints com regras MECE e mensagens de erro.
- [x] **1.A.3** Sanitização: deletar implementação precoce em `src/`.
- [x] **1.A.4** Validar `yarn test:nova-cli` com `it.skip`.
- [x] **1.A.5** Criar `BLUEPRINT_STRUCTURE.md`.
- [x] **1.A.N** Pipeline verde (skips válidos).
- [x] **1.A.6** Débitos: atualizar `NEXT.md`.
- [x] **1.A.[COMMIT]** `chore(spec-0021): pasta src sanitizada e blueprints enriquecidos...`.

## Sub-bloco [1.AS] — Sanitização intermediária (Blueprint Integrity Lock) 🧼

> **Âncora:** `[DEC-0021-C01]`
> **Objetivo:** impedir drift/boundary leak antes da expansão arquitetural.

- [x] **1.AS.1 [Boundaries]** Guardrails anti-acoplamento implementados:
  - `domain/**` não importa `app/**` nem `infrastructure/**`
  - `app/**` acessa infraestrutura apenas via ports
- [x] **1.AS.2 [Enforcement]** Boundary enforcement automatizado via `Boundaries.test.ts`
- [x] **1.AS.3 [Blueprint strength]** Testes críticos fortalecidos com:
  - casos negativos
  - mensagens determinísticas
  - invariantes explícitas
- [x] **1.AS.4 [Skip policy]** Política de `it.skip` aplicada com `SKIP-REASON`
- [x] **1.AS.N** Pipeline verde
- [x] **1.AS.[COMMIT]** `chore(spec-0021): blueprint integrity lock`

---

## Sub-bloco [1.B] — Domínio (Entidades + Policies puras) 🧠

> **Âncoras:** `[DEC-0021-A02]`, `[DEC-0021-C01]`

- [x] **1.B.1** Linguagem ubíqua formalizada:
  - `WorkItemKind`
  - `LifecycleStatus`
  - `ResolutionMode`
  - `Dense/Virtual`
- [x] **1.B.2** Domínio separado em:
  - `WorkItem`
  - `WorkItemDraft`
  - `WorkItemPolicy`
- [x] **1.B.3** `GovernancePolicies` introduzido como façade fina de composição
- [x] **1.B.4** `PromotionPolicy` extraído como policy pura isolada
- [x] **1.B.5** Regras MECE implementadas e validadas
- [x] **1.B.6** `Pillars.test.ts` e `Promotion.test.ts` ativos e verdes
- [x] **1.B.N** Pipeline verde
- [x] **1.B.[COMMIT]** `feat(spec-0021): domínio + policies puras consolidadas`

---

## Sub-bloco [1.C] — Registry SSOT (memória + integridade) 📚

> **Âncoras:** `[DEC-0021-A01]`, `[DEC-0021-C01]`

- [x] **1.C.1** Registry em memória implementado
- [x] **1.C.2** Ordenação determinística aplicada
- [x] **1.C.3** Integridade implementada:
  - unicidade de IDs
  - imutabilidade de `id`
  - imutabilidade de `createdAt`
  - `updatedAt` controlado
- [x] **1.C.4** `Integrity.test.ts` ativo e verde
- [ ] **1.C.5** Estratégia definitiva para preservação de comentários YAML (adiado para IO real)
- [x] **1.C.N** Pipeline verde
- [x] **1.C.[COMMIT]** `feat(spec-0021): registry SSOT em memória`

---

## Sub-bloco [1.D] — Application Layer + Atomicidade 🧩

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-C01]`

- [x] **1.D.1** Ports implementados:
  - `RegistryStore`
  - `WorkspaceStore`
  - `Clock`
  - `IdGenerator`
- [x] **1.D.2** Use cases implementados:
  - `RegisterWorkItem`
  - `PromoteWorkItem`
- [x] **1.D.3** Rollback bilateral implementado:
  - rollback registry
  - rollback workspace
- [x] **1.D.4** `RegisterItem.test.ts` e `PromoteItem.test.ts` ativos e verdes
- [x] **1.D.N** Pipeline verde
- [x] **1.D.[COMMIT]** `feat(spec-0021): application layer policy-first`

## Encerramento de PR1 (gate)

- [x] **1.[READY-FOR-REVIEW]** Só marcar “Ready” quando:
  - testes críticos verdes (não só skip)
  - boundaries enforcement ativo
  - registry integrity verde
  - use cases com rollback verde

- [x] **1.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [x] **1.[MERGE]** Merge após gate humano.

---

# 🚧 Fase 2 — Topology Migration Layer (PR2)

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-B05]`, `[DEC-0021-C01]`
> **Objetivo:** operacionalizar Strangler Fig + alinhar `.core/rules/` com builder/runtime.
> **Regra:** esta fase NÃO é rename cosmético; ela define contratos de migração e compatibilidade.

## [PR-MGMT] PR2

- [x] **2.[PR-MGMT.NEW-BRANCH]** Branch: `feat/spec-0021-pr2-topology-migration-layer`.
- [ ] **2.[PR-MGMT.DESCRIPTION]** (6 seções obrigatórias).
- [ ] **2.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório.
- [ ] **2.[PR-MGMT.MERGE-CHAIN]** `yarn format ; yarn check ; yarn test:nova-cli ; yarn build:rules`.

---

## Sub-bloco [2.A] — GovernanceWorkspace (Strangler Fig) 🏛️

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-C01]`

### Contratos obrigatórios (precisam virar testes)

- [x] **2.A.1 [Discovery Contract]** Detectar estado do repo:
  - workspace já em `.governance/`
  - legado em `.specify/` e/ou `.ai-guidelines/`
  - estado “misto” (ambos existem) deve falhar com instrução explícita (sem heurística silenciosa)

- [x] **2.A.2 [Precedence Policy]** Regra explícita:
  - se `.governance/` existe: é SSOT; legado só pode ser lido via modo explícito (bridge)
  - se `.governance/` não existe: CLI oferece migração/adopção (não alias invisível)

- [x] **2.A.3 [Idempotência]** Rodar “adopt/migrate” duas vezes não gera churn nem duplica estado.
- [x] **2.A.4 [Rollback]** Falha durante migração não corrompe `registry.yml` nem topologia física:
  - se criar pasta falhar, rollback do registry
  - se persistir registry falhar, rollback do filesystem (quando aplicável)

- [ ] **2.A.5 [Deprecation Plan]** Definir marco explícito de deprecação:
  - quando parar de ler `.specify/` / `.ai-guidelines/`
  - como comunicar (warnings determinísticos)

- [x] **2.A.6 [No-Silent-Alias]** Proibir “alias mágico” que masque caminhos antigos como se fossem `.governance/`.

### Implementação (bounded context)

- [x] **2.A.7** Implementar `GovernanceWorkspace` como agregado:
  - resolve root
  - aplica precedence
  - executa migração idempotente
  - expõe “workspace state” para a Application layer

- [ ] **2.A.8** Implementar bridges explícitas (temporárias) para leitura do legado:
  - ponteiros/control flags, nunca path hardcoded espalhado

### Testes (obrigatórios)

- [x] **2.A.9** Criar e passar:
  - `WorkspaceDiscovery.test.ts`
  - `LegacyPrecedence.test.ts`
  - `WorkspaceMigrationIdempotency.test.ts`
  - `WorkspaceRollback.test.ts`

- [x] **2.A.N** Pipeline verde.

- [ ] **2.A.[COMMIT]** `feat(spec-0021): GovernanceWorkspace (strangler fig operacional)`.

---

## Sub-bloco [2.B] — Registry YAML SSOT (IO real) 🧾

> **Âncoras:** `[DEC-0021-A01]`, `[DEC-0021-A03]`, `[DEC-0021-C01]`
> **Objetivo:** sair do “in-memory” e fazer IO real com YAML mantendo propriedade human-friendly.

### Contratos obrigatórios

- [ ] **2.B.1 [Round-trip]** Read → write não pode destruir informação essencial.
- [ ] **2.B.2 [Determinismo]** Serialização ordenada e estável (evitar churn em PRs).
- [ ] **2.B.3 [Imutabilidade]** `id` e `createdAt` imutáveis; `updatedAt` controlado.
- [ ] **2.B.4 [Schema Guard]** Rejeitar estado inválido com erros determinísticos (mensagens estáveis).
- [ ] **2.B.5 [Comment Preservation]** Estratégia explícita (hard-mode):
  - ou implementar preservação
  - ou escolher lib e documentar tradeoff (exige aprovação humana explícita)

### Implementação

- [ ] **2.B.6** Implementar `GovernanceRegistryStore` (infra) e `RegistryService` (domain boundary):
  - ports no app layer
  - infra faz IO
  - domain valida e decide

### Testes (obrigatórios)

- [ ] **2.B.7** Criar e passar:
  - `RegistryYamlDeterminism.test.ts`
  - `RegistrySchemaGuard.test.ts`
  - `RegistryRoundTrip.test.ts`
  - `RegistryCommentPreservation.test.ts` (ou marcado com `SKIP-REASON` explícito)

- [ ] **2.B.N** Pipeline verde.

- [ ] **2.B.[COMMIT]** `feat(spec-0021): YAML registry SSOT com guardrails (determinístico)`.

---

## Sub-bloco [2.C] — RulesEngine (builder/runtime alignment) 🧠

> **Âncoras:** `[DEC-0021-B05]`, `[DEC-0021-C01]`
> **Objetivo:** alinhar topologia física `.core/rules/` com builder e runtime.
> **Regra:** reorg físico deve ser atômico com update de loaders/scripts/tests.

### Contratos obrigatórios

- [ ] **2.C.1 [Taxonomia]** Formalizar Top/Center/Base e refletir na topologia física.
- [ ] **2.C.2 [Determinismo]** Build/projeções determinísticos.
- [ ] **2.C.3 [Compatibility]** Se houver consumers internos, garantir ponteiros/redirects no mesmo commit.
- [ ] **2.C.4 [No Hardcoded Paths]** Centralizar resolução de paths no domínio (ou infra adapter único).

### Implementação

- [ ] **2.C.5** Implementar `RulesEngine` (bounded context):
  - parser pipeline
  - build pipeline
  - projection pipeline
  - runtime lookup

- [ ] **2.C.6** Reorganizar `.core/rules/` de forma dirigida (um commit atômico) + atualizar:
  - `yarn build:rules` (ou equivalente)
  - loaders/imports
  - docs/pointers
  - smoke tests

### Testes (obrigatórios)

- [ ] **2.C.7** Criar e passar:
  - `RulesCompilation.test.ts`
  - `RulesProjection.test.ts`
  - `RulesTopologyConsistency.test.ts`

- [ ] **2.C.N** Pipeline verde incluindo `yarn build:rules`.

- [ ] **2.C.[COMMIT]** `refactor(spec-0021): RulesEngine + reorg .core/rules alinhada ao runtime`.

---

## Sub-bloco [2.D] — Superfície publicada e docs de contrato 📣

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-B02]`
> **Objetivo:** garantir que help/docs/smoke referenciem `.governance/` como contrato real.

- [ ] **2.D.1** Atualizar docs e help da CLI para `.governance/` (sem alias mágico).
- [ ] **2.D.2** Reservar diretórios canônicos dentro de `.governance/` para:
  - `intake/` (PRD/intake)
  - `handoff/`
  - `telemetry/`

- [ ] **2.D.3** Atualizar smoke tests que assumem `.specify/`/`.ai-guidelines/`.
- [ ] **2.D.N** Pipeline verde.
- [ ] **2.D.[COMMIT]** `docs(spec-0021): contrato .governance + reservas canônicas`.

---

## Encerramento de PR2 (gate)

- [ ] **2.[READY-FOR-REVIEW]** Só marcar “Ready” quando:
  - migrations com precedence/idempotência/rollback provados por testes
  - registry YAML com determinismo e schema guard (e decisão sobre comentários)
  - rules reorg atômico com `build:rules` verde
  - docs/smoke alinhados ao contrato `.governance/`

- [ ] **2.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [ ] **2.[MERGE]** Merge após gate humano.

---

# 🚧 Fase 3 — Executable Intelligence Runtime (PR3)

> **Âncoras:** `[DEC-0021-C01]`, `[DEC-0021-D01]`
> **Objetivo:** Living Documentation como projeção viva (AST + drift guard) + TemplateEngine por composição atômica com validação estrutural.

## [PR-MGMT] PR3

- [ ] **3.[PR-MGMT.NEW-BRANCH]** Branch: `feat/spec-0021-pr3-executable-intelligence-runtime`.
- [ ] **3.[PR-MGMT.DESCRIPTION]** (6 seções obrigatórias).
- [ ] **3.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório.
- [ ] **3.[PR-MGMT.MERGE-CHAIN]** `yarn format ; yarn check ; yarn test:nova-cli` (+ comandos novos da fase).

---

## Sub-bloco [3.A] — LivingDocumentation: schema, versioning, determinismo 🛰️

> **Âncora:** `[DEC-0021-C01]`

### Contratos obrigatórios

- [ ] **3.A.1 [Schema v0]** Definir schema do artefato gerado a partir de testes `[BR-CLI-*]`:
  - `ruleId`
  - `title` (ou summary)
  - `boundedContext`
  - `domain`
  - `source` (file + line range)
  - `tags`
  - `coverageState` (covered/pending/deprecated)
  - `schemaVersion`

- [ ] **3.A.2 [Versioning]** Definir evolução: como migrar v0→v1 sem quebrar consumers.
- [ ] **3.A.3 [Determinismo]** Ordenação e serialização determinísticas:
  - mesma entrada => mesmo output byte-a-byte
  - sem timestamps variáveis no arquivo (ou separados)

- [ ] **3.A.4 [Path]** Definir path canônico dentro de `.governance/` para o artefato (ex.: `.governance/living-docs.yml`).

### Testes (obrigatórios)

- [ ] **3.A.5** Criar e passar:
  - `LivingDocsSchema.test.ts`
  - `LivingDocsDeterminism.test.ts`
  - `LivingDocsVersioning.test.ts`

- [ ] **3.A.N** Pipeline verde.

- [ ] **3.A.[COMMIT]** `feat(spec-0021): living docs schema (v0) + determinismo`.

---

## Sub-bloco [3.B] — AST extraction (sem regex frágil) + source mapping 🧬

> **Âncora:** `[DEC-0021-C01]`

### Contratos obrigatórios

- [ ] **3.B.1 [AST-first]** Extrair `[BR-CLI-*]` via AST (TypeScript/Jest), não regex.
- [ ] **3.B.2 [Source mapping]** Capturar file/linha com consistência (line range quando aplicável).
- [ ] **3.B.3 [False positives]** Evitar extração de IDs em strings irrelevantes.
- [ ] **3.B.4 [Coverage semantics]** Definir o que é “covered”: teste ativo vs skip.

### Implementação

- [ ] **3.B.5** Implementar `RuleExtractor` (bounded context LivingDocumentation):
  - parse suite
  - extrai IDs
  - agrega metadados
  - escreve artefato determinístico

### Testes (obrigatórios)

- [ ] **3.B.6** Criar e passar:
  - `AstRuleExtractor.test.ts`
  - `RuleExtractorSourceMap.test.ts`
  - `RuleExtractorFalsePositives.test.ts`

- [ ] **3.B.N** Pipeline verde.

- [ ] **3.B.[COMMIT]** `feat(spec-0021): AST extractor de BR-CLI com source mapping`.

---

## Sub-bloco [3.C] — Drift guard (CI) + definição formal de drift 🧨

> **Âncora:** `[DEC-0021-C01]`

### Definição formal de drift (obrigatória)

- [ ] **3.C.1** Drift é qualquer uma das condições:
  - teste ativo com `[BR-CLI-*]` sem entrada no artefato gerado
  - ID renomeado sem atualização do artefato
  - artefato gerado divergente do repositório (não commitado/atualizado)
  - mudança de ordenação/serialização que cause churn artificial

- [ ] **3.C.2** Definir mecanismo de falha:
  - gerar artefato
  - comparar com versão commitada (diff determinístico)
  - falhar CI se diferente

### Implementação

- [ ] **3.C.3** Criar script/command `yarn living-docs:generate` e `yarn living-docs:check`.
- [ ] **3.C.4** Integrar `living-docs:check` ao CI (job obrigatório).

### Testes (obrigatórios)

- [ ] **3.C.5** Criar e passar:
  - `DriftGuardDetectsOutdatedArtifact.test.ts`
  - `DriftGuardNoChurn.test.ts`

- [ ] **3.C.N** Pipeline verde incluindo CI/local check.

- [ ] **3.C.[COMMIT]** `feat(spec-0021): drift guard (CI) para living docs`.

---

## Sub-bloco [3.D] — TemplateEngine: schema de recipes + partials atômicos 🧩

> **Âncora:** `[DEC-0021-D01]`

### Contratos obrigatórios

- [ ] **3.D.1 [Recipes schema]** Definir schema declarativo das recipes:
  - `artifactKind` (spec/plan/tasks/…)
  - `workflowType` (evidence-driven/mixed/…)
  - `language`
  - `slots[]` (ordem canônica)
  - `partials[]` por slot

- [ ] **3.D.2 [Partials contract]** Cada partial deve ser Markdown válido completo (não fragmento arbitrário).
- [ ] **3.D.3 [Determinismo]** Montagem determinística: mesma recipe => mesmo output.

### Implementação

- [ ] **3.D.4** Implementar `TemplateEngine`:
  - resolve recipe (por registry.yml ou por argumento)
  - carrega partials
  - monta por slots
  - valida estrutura antes de persistir

### Testes (obrigatórios)

- [ ] **3.D.5** Criar e passar:
  - `RecipeResolution.test.ts`
  - `PartialsContract.test.ts`
  - `DeterministicAssembly.test.ts`

- [ ] **3.D.N** Pipeline verde.

- [ ] **3.D.[COMMIT]** `feat(spec-0021): TemplateEngine (recipes + partials)`.

---

## Sub-bloco [3.E] — Validação estrutural do Markdown (semântica, não estética) 🧱

> **Âncora:** `[DEC-0021-D01]`

### Contratos obrigatórios

- [ ] **3.E.1** Validar invariantes por `artifactKind`:
  - headings mandatórios
  - ordem de seções
  - blocos obrigatórios (ex.: Harness Lock em tasks)
  - proibir seções indevidas (ex.: “Stage 1” em artefato errado)

- [ ] **3.E.2** Validar coerência recipe/slots:
  - slot faltando => falha
  - partial inválido => falha

- [ ] **3.E.3** Mensagens determinísticas (para PR review).

### Testes (obrigatórios)

- [ ] **3.E.4** Criar e passar:
  - `MarkdownStructuralValidation.test.ts`
  - `SlotCompleteness.test.ts`
  - `ForbiddenComposition.test.ts`

- [ ] **3.E.N** Pipeline verde.

- [ ] **3.E.[COMMIT]** `feat(spec-0021): validação estrutural de markdown para recipes`.

---

## Sub-bloco [3.F] — Retirada segura do mirror legado 🧯

> **Âncora:** `[DEC-0021-D01]`
> **Regra:** só remover mirror após equivalência mínima validada.

- [ ] **3.F.1** Mapear equivalência mínima:
  - arquivos gerados pelo mirror atual vs pelo TemplateEngine
  - delta aceito (apenas o intencional)

- [ ] **3.F.2** Criar testes de regressão de geração (snapshot determinístico).
- [ ] **3.F.3** Trocar fluxo padrão para recipes/partials.
- [ ] **3.F.4** Depreciar mirror com warning determinístico e prazo (se necessário).
- [ ] **3.F.N** Pipeline verde.
- [ ] **3.F.[COMMIT]** `refactor(spec-0021): remove mirror legado após equivalência (recipes)`.

---

## Encerramento de PR3 (gate)

- [ ] **3.[READY-FOR-REVIEW]** Só marcar “Ready” quando:
  - schema v0 definido + determinismo provado
  - AST extractor funcional (sem regex) + source mapping
  - drift guard integrado ao CI
  - TemplateEngine monta + valida estruturalmente
  - mirror legado removido ou formalmente depreciado com regressão coberta

- [ ] **3.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [ ] **3.[MERGE]** Merge após gate humano.

---

# 🚧 Fase 4 — Governance Consolidation (PR4)

> **Âncoras:** `[DEC-0021-B02]`, `[DEC-0021-B03]`, `[DEC-0021-B04]`, `[DEC-0021-B05]`
> **Objetivo:** consolidar arquitetura de informação do repo-fonte (carrier + placement + foundation/ADR) e remover ilhas de docs/ponteiros quebrados.
> **Nota:** Fases 4–5 “produto/DB/dashboard” continuam fora do escopo (apenas mapeadas) `[DEC-0021-B01]`.

## [PR-MGMT] PR4

- [ ] **4.[PR-MGMT.NEW-BRANCH]** Branch: `feat/spec-0021-pr4-governance-consolidation`.
- [ ] **4.[PR-MGMT.DESCRIPTION]** (6 seções obrigatórias).
- [ ] **4.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório.
- [ ] **4.[PR-MGMT.MERGE-CHAIN]** `yarn format ; yarn check ; yarn test:nova-cli` (+ smoke se aplicável).

---

## Sub-bloco [4.A] — Carrier híbrido: catálogo canônico + topologia dirigida 🗺️

> **Âncoras:** `[DEC-0021-B02]`, `[DEC-0021-B03]`

- [ ] **4.A.1** Criar `GOVERNANCE-CATALOG.md` (ou nome final) como carrier canônico curto:
  - classes/gêneros
  - paths canônicos
  - regras de lookup
  - lifecycle/responsabilidades

- [ ] **4.A.2** Garantir consistência com a topologia real do repo (modelo híbrido):
  - se o catálogo diz X, o repo deve expressar X

- [ ] **4.A.3** Reservar explicitamente paths de gêneros futuros em `.governance/`:
  - `intake/`
  - `handoff/`
  - `telemetry/`

- [ ] **4.A.N** Pipeline verde.
- [ ] **4.A.[COMMIT]** `docs(spec-0021): carrier híbrido (catálogo) + reservas de lar`.

---

## Sub-bloco [4.B] — Foundation vs ADR (fronteira híbrida explícita) 📜

> **Âncora:** `[DEC-0021-B04]`

- [ ] **4.B.1** Renomear/refatorar `.core/process/spec-foundation.md` para refletir governança (nome final decidido aqui).
- [ ] **4.B.2** Extrair decisões arquiteturais estáveis para ADRs:
  - critério de migração: “decisão estável/cross-spec”
  - foundation permanece processo vivo e constituição operacional

- [ ] **4.B.3** Atualizar links/cross-refs após renomeação.
- [ ] **4.B.N** Pipeline verde.
- [ ] **4.B.[COMMIT]** `refactor(spec-0021): fronteira foundation/ADR aplicada`.

---

## Sub-bloco [4.C] — Cleanup holístico de docs e ponteiros (eliminar ilhas) 🧹

> **Âncoras:** `[DEC-0021-B03]`, `[DEC-0021-B04]`
> **Objetivo:** remover “ilhas órfãs” (ex.: `/docs`) e alinhar todos os ponteiros ao novo contrato.

- [ ] **4.C.1** Auditar `/docs` e decidir:
  - migrar conteúdo útil para lar canônico
  - depreciar/remover o resto

- [ ] **4.C.2** Atualizar ponteiros públicos e internos:
  - `README.md`
  - `CONTRIBUTING.md`
  - `AGENTS.md`
  - docs de CLI/help

- [ ] **4.C.3** Validar que não há referências quebradas a `.specify/`/`.ai-guidelines/` quando o contrato final é `.governance/`.
- [ ] **4.C.N** Pipeline verde.
- [ ] **4.C.[COMMIT]** `docs(spec-0021): cleanup holístico de docs + ponteiros`.

---

## Sub-bloco [4.D] — Homologação final (contrato distribuído) ✅

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-C01]`, `[DEC-0021-D01]`

- [ ] **4.D.1** Smoke: validar instalação/execução headless e geração de artefatos sob `.governance/`.
- [ ] **4.D.2** Validar `registry.yml` como SSOT e markdown derivado coerente.
- [ ] **4.D.3** Validar living docs (geração + check) e drift guard.
- [ ] **4.D.4** Validar TemplateEngine (recipes/partials) gerando artefatos válidos.
- [ ] **4.D.N** Pipeline verde.
- [ ] **4.D.[COMMIT]** `chore(spec-0021): homologação final (contrato governance-driven)`.

---

## Encerramento de PR4 (gate)

- [ ] **4.[READY-FOR-REVIEW]** Só marcar “Ready” quando:
  - carrier híbrido publicado
  - foundation/ADR fronteira aplicada
  - docs/ponteiros alinhados
  - smoke/homologação verde

- [ ] **4.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [ ] **4.[MERGE]** Merge após gate humano.

---

# 🔎 Fase de Review (Gate de Homologação)

> Executada após PR0–PR4 estarem mergeadas em `main`.

- [ ] **R.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **R.2** Pipeline canônico verde (suite completa).
- [ ] **R.3** Confirmar critérios de aceite da `spec.md` e DoD do `plan.md`.
- [ ] **R.4** Confirmar todos `[DEC-0021-*]` refletidos em código, docs e topologia.
- [ ] **R.5** Validar em ambiente real quando aplicável (tarball/smoke).
- [ ] **R.6** Consolidar descrição final de entrega.
- [ ] **R.7** **[MANDATÓRIO]** Gate humano final.
- [ ] **R.8** Iterar correções até aprovação.

---

# 🧾 Encerramento Pré-Merge

> Executado no branch/PR final após aprovação do gate.

- [ ] **F.1** `NEXT.md`: migrar débitos relevantes para `roadmap/backlog.md` e deletar `NEXT.md`.
- [ ] **F.2** Migrar research novo relevante para `.specify/specs/researchs/<domínio>/` e indexar em `research-index.md`.
- [ ] **F.3** `decision-brief.md` permanece no diretório da spec.
- [ ] **F.4** `spec.md`: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **F.5** `roadmap/historico.md`: mover 0021 para concluídas e remover de “Em execução”.
- [ ] **F.6** Atualizar `CHANGELOG.md` e `package.json` se houver impacto publicado (ou registrar “não aplicável”).
- [ ] **F.7** Confirmar que nenhuma outra spec foi aberta antes do encerramento desta.
- [ ] **F.8 [COMMIT]** `chore(spec-0021): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **F.9 [MANDATÓRIO]** Aprovação humana explícita para merge.
