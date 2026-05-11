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
2. **Pilares MECE como origem de valor:** `spec`, `spike`, `fix`, `patch`, `incident`, `proposal`, `experiment`. `[DEC-0021-A02]` (renomeação `exploration` → `spike` em 2026-05-11; ADR `.core/governance/adrs/0001-taxonomy-mece-pillars.md`).
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

### [SUB-MGMT.MANDATORY] — Contrato obrigatório por sub-bloco

> A partir de 2026-05-10 (durante PR2.A): **todo sub-bloco** das fases 2, 3 e 4 DEVE encerrar com dois itens explícitos antes do `[COMMIT]`, e ambos precisam ser verificáveis no diff do sub-bloco:

- **`[<id>.DEBT-REVIEW]`** — revisitar `.specify/specs/0021-governance-information-architecture/NEXT.md`:
  - marcar débitos da fase anterior que o sub-bloco resolveu (parcial ou totalmente);
  - registrar débitos novos introduzidos pelo sub-bloco (com data + escopo claro);
  - se nada mudou, declarar explicitamente "nenhum impacto em débitos" no commit.
- **`[<id>.ARCHITECTURE]`** — atualizar `.core/governance/ARCHITECTURE.md` quando o sub-bloco:
  - criar/renomear bounded context;
  - introduzir invariante, port ou erro de domínio novo;
  - alterar glossário, roadmap ou semântica de migração/rollback;
  - se nenhuma das condições se aplicar, declarar explicitamente "sem impacto em ARCHITECTURE" no commit.

**Por que obrigatório:** evita drift silencioso entre código e doc canônica, e mantém `NEXT.md` como espelho honesto da fase em execução. Falha desta validação reabre o sub-bloco — não é débito futuro.

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

- [x] **1.[PR-MGMT.NEW-BRANCH]** Branch: `feat/spec-0021-pr1-domain-memory-foundation`. _PR1 merged via commit `9c1cd19` (2026-05-10) — registro retroativo aplicado em [2.C-sanitize]._
- [x] **1.[PR-MGMT.DESCRIPTION]** 6 seções obrigatórias (decisões/contextos/invariantes/riscos/rollback/validação) entregues na descrição do PR #11.
- [x] **1.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório aprovado antes do merge.
- [x] **1.[PR-MGMT.MERGE-CHAIN]** `yarn format ; yarn check ; yarn test:nova-cli` verde no merge.

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
- [x] **1.C.5** Estratégia definitiva para preservação de comentários YAML — _resolvido em **2.B.5** via Caminho A (`parseDocument` + mutação granular em `Document`/`YAMLMap`/`YAMLSeq` do `yaml@2`); load → mutate → save preserva comentários inline e de cabeçalho. Limitação herdada (`commentBefore` migra para o próximo nó em `remove`) documentada como comportamento conservador._
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

- [x] **2.A.[DEBT-REVIEW]** `NEXT.md` atualizado 2026-05-10: débito 5 (E2E) marcado como parcialmente mitigado via `NodeWorkspaceIntegration.test.ts`; novos débitos 2.A.5 (deprecation plan), 2.A.8 (bridge reader), race em `existedBefore`, skips de `Isolation.test.ts` e `FileSystemAdapter.test.ts` registrados.
- [x] **2.A.[ARCHITECTURE]** `ARCHITECTURE.md` atualizado 2026-05-10: §B.1 ganhou tabela PR2 com `GovernanceWorkspace`; §B.2 removeu-o de "reservado"; §C ganhou invariantes 9 (precedência explícita) e 10 (rollback não-destrutivo); §F roadmap; §G glossário com `WorkspaceProvisioner`, `FileSystemProbe`, `WorkspaceState`, `WorkspaceResolution`, `MigrationPlan`.
- [ ] **2.A.[COMMIT]** `feat(spec-0021): GovernanceWorkspace (strangler fig operacional)`.

---

## Sub-bloco [2.B] — Registry YAML SSOT (IO real) 🧾

> **Âncoras:** `[DEC-0021-A01]`, `[DEC-0021-A03]`, `[DEC-0021-C01]`
> **Objetivo:** sair do “in-memory” e fazer IO real com YAML mantendo propriedade human-friendly.

### Contratos obrigatórios

- [x] **2.B.1 [Round-trip]** Read → write não pode destruir informação essencial.
- [x] **2.B.2 [Determinismo]** Serialização ordenada e estável (evitar churn em PRs).
- [x] **2.B.3 [Imutabilidade]** `id` e `createdAt` imutáveis; `updatedAt` controlado.
- [x] **2.B.4 [Schema Guard]** Rejeitar estado inválido com erros determinísticos (mensagens estáveis).
- [x] **2.B.5 [Comment Preservation]** Caminho A implementado: `parseDocument` + mutação granular preserva comentários inline e de cabeçalho em `load → mutate → save`. Limitação herdada do yaml@2 (`commentBefore` migra para o próximo nó em `remove`) documentada como comportamento conservador (não-destrutivo).

### Implementação

- [x] **2.B.6** Implementar `GovernanceRegistryStore` (infra) e `RegistryService` (domain boundary):
  - ports no app layer (`PersistentRegistryStore`)
  - infra faz IO (`src/infrastructure/yaml/`)
  - domain valida e decide (schema guard puro em `registrySchema.ts`)

### Testes (obrigatórios)

- [x] **2.B.7** Criar e passar:
  - `RegistryYamlDeterminism.test.ts`
  - `RegistrySchemaGuard.test.ts`
  - `RegistryRoundTrip.test.ts`
  - `RegistryCommentPreservation.test.ts`

- [x] **2.B.N** Pipeline verde (101 passed, 15 skipped pré-existentes, 0 failed).

- [x] **2.B.[DEBT-REVIEW]** `NEXT.md` atualizado 2026-05-10: `FileSystemAdapter.test.ts` resolvido por equivalência (atomicidade coberta no novo store); `Isolation.test.ts` segue em skip por dependência de `WorkspaceStore` real (não-2.B); Comment Preservation registrada como implementada com limitação conservadora; cobertura ergonômica do `RegistryService` e ligação CLI→store real documentadas como débitos.
- [x] **2.B.[ARCHITECTURE]** `ARCHITECTURE.md` atualizado 2026-05-10: `Registry (YAML SSOT)` movido de §B.2 para §B.1 PR2; invariante 7 reescrita ("YAML é SSOT real"); §G ganhou `GovernanceRegistryStore`, `PersistentRegistryStore`, `RegistryService`, família `REGISTRY_YAML_*`; §F roadmap reflete "2.A/2.B entregues".
- [ ] **2.B.[COMMIT]** `feat(spec-0021): YAML registry SSOT com guardrails (determinístico)`.

---

## Sub-bloco [2.C] — RulesEngine (builder/runtime alignment) 🧠

> **Âncoras:** `[DEC-0021-B05]`, `[DEC-0021-C01]`
> **Objetivo:** alinhar topologia física `.core/rules/` com builder e runtime.
> **Regra:** reorg físico deve ser atômico com update de loaders/scripts/tests.

### Contratos obrigatórios

- [x] **2.C.1 [Taxonomia]** Formalizar Top/Center/Base e refletir na topologia física.
- [x] **2.C.2 [Determinismo]** Build/projeções determinísticos.
- [x] **2.C.3 [Compatibility]** Se houver consumers internos, garantir ponteiros/redirects no mesmo commit.
- [x] **2.C.4 [No Hardcoded Paths]** Centralizar resolução de paths no domínio (ou infra adapter único).

### Implementação

- [x] **2.C.5** Implementar `RulesEngine` (bounded context):
  - parser pipeline
  - build pipeline
  - projection pipeline
  - runtime lookup

- [x] **2.C.6** Reorganizar `.core/rules/` de forma dirigida (um commit atômico) + atualizar:
  - `yarn build:rules` (ou equivalente)
  - loaders/imports
  - docs/pointers
  - smoke tests

### Testes (obrigatórios)

- [x] **2.C.7** Criar e passar:
  - `RulesCompilation.test.ts`
  - `RulesProjection.test.ts`
  - `RulesTopologyConsistency.test.ts`

- [x] **2.C.N** Pipeline verde incluindo `yarn build:rules`.

- [x] **2.C.[DEBT-REVIEW]** `NEXT.md` atualizado 2026-05-10: 5 débitos 2.C registrados (builder mjs como SSOT até PR3, ponteiros documentais legados em specs históricas, Boundary Lock por regex revisitado, mapa estático `OPT_IN_FEATURE_LAYOUT`, suite end-to-end com `JsonRulesCatalogSource` adiada para PR3).
- [x] **2.C.[ARCHITECTURE]** `ARCHITECTURE.md` atualizado 2026-05-10: `RulesEngine` saiu de §B.2 (reservados) e entrou em §B.1 PR2 com pipelines (parse/build/projection/lookup); §C ganhou invariante 11 (topologia física reflete taxonomia de runtime; paths centralizados em `domain/rules/ruleZone.ts`); §G glossário ganhou `RulesEngine`, `RuleScope`, `RuleZone`, `OPT_IN_FEATURE_LAYOUT`, família `RULES_*` errors; §H convenções ganhou entrada `.core/rules/{top,center,base,adapters,_meta}/`; §F roadmap reflete "2.A/2.B/2.C entregues".
- [ ] **2.C.[COMMIT]** `refactor(spec-0021): RulesEngine + reorg .core/rules alinhada ao runtime`.

---

## Sub-bloco [2.C-sanitize] — Auditoria DDD + drift cleanup pré-2.D 🧼

> **Âncoras:** `[DEC-0021-A02]`, `[DEC-0021-C01]`
> **Objetivo:** materializar a auditoria DDD documentada em [`./audit-2026-05-10-pre-2d-sanitization.md`](./audit-2026-05-10-pre-2d-sanitization.md) como sub-bloco atômico antes de iniciar 2.D, eliminando drift entre tipos/validação/docs sem reabrir decisões.
> **Regra:** sub-bloco fechado em commit único; nenhum item aqui muda contrato decidido — apenas reconcilia código, docs e testes com o gate já fechado.

### Fase 1 — Bug fixes (obrigatórios) 🔴

- [x] **2.C-sanitize.F1.1 [Policy virtual generalizada]** `WorkItemPolicy.assertValidDraft` passa a rejeitar `workspacePath` em **qualquer** virtual kind (proposal/patch/fix) com código `POLICY_VIRTUAL_REJECTS_WORKSPACE`. O antigo `POLICY_PROPOSAL_MUST_BE_VIRTUAL` deixa de ser emitido (pre-1.0; sem release pública dependendo dele). `Pillars.test.ts` ganha suite parametrizada cobrindo os 3 virtuais.
- [x] **2.C-sanitize.F1.2 [Contagem de pilares reconciliada]** `plan.md` (3 ocorrências) e `decision-brief.md` A02 alinhados a "7 pilares". Entrada nova em `plan.md § 📐 Decisões revisitadas` registra a adição de `experiment` em 2026-05-10. Ressalva pós-it em `decision-brief.md` A02 sincroniza sem reabrir o gate.

### Fase 2 — Drift docs ↔ código 🟡

- [x] **2.C-sanitize.F2.1** `tasks.md` 1.C.5 marcado `[x]` com cross-ref `(resolvido em 2.B.5 via parseDocument + mutação granular)`.
- [x] **2.C-sanitize.F2.2** PR1 PR-MGMT headers (`1.[PR-MGMT.NEW-BRANCH]`, `.DESCRIPTION`, `.REVIEW-GATE`, `.MERGE-CHAIN`) marcados `[x]` retroativos com nota `PR1 merged 9c1cd19 (2026-05-10)`.
- [x] **2.C-sanitize.F2.3** `ARCHITECTURE.md` §E.3 ganha linha documentando inversão de ordem `Register` (registry→workspace) vs `Promote` (workspace→registry) e o motivo (evitar estado intermediário com `kind=spec` apontando para pasta inexistente).
- [x] **2.C-sanitize.F2.4** `RegistryService.ts` linha 4: remover comentário fantasma sobre `RegistryLoader.loadFromPath` (classe inexistente).

### Fase 3 — Cleanup leve 🟢

- [x] **2.C-sanitize.F3.1** `DiscoverWorkspace.execute` itera `LEGACY_SOURCES` em vez de strings literais `.specify`/`.ai-guidelines`.
- [x] **2.C-sanitize.F3.2** `.gitignore` ganha padrão `*.stackdump` (artefatos do bash Windows).
- [x] **2.C-sanitize.F3.3** Remover re-export inútil de `RULE_ZONES` em `RulesCatalog.ts` (consumidor real importa de `Rule.ts`).
- [x] **2.C-sanitize.F3.4** Extrair `assertRegistryImmutables(current, patch)` para `src/domain/registry/integrity.ts`; `InMemoryRegistry.update` e `GovernanceRegistryStore.update` passam a delegar. Helper coberto por teste pequeno em isolamento.

### Validação e fechamento

- [x] **2.C-sanitize.N** Pipeline verde: `yarn format ; yarn check ; yarn test:nova-cli ; yarn test ; yarn build:rules` (120 ts + 267 mjs).
- [x] **2.C-sanitize.[DEBT-REVIEW]** `NEXT.md`: atualizar débitos 2.B.4 (RegistryService autosave/batch) e 2.C.5 (JsonRulesCatalogSource E2E) com referência à auditoria; registrar item explícito "Auditoria pré-2.D executada em 2026-05-10". Nenhum débito novo.
- [x] **2.C-sanitize.[ARCHITECTURE]** `ARCHITECTURE.md` atualizado conforme F2.3; nenhum bounded context novo.
- [x] **2.C-sanitize.[COMMIT]** `chore(spec-0021): sanitização pré-2.D (bug fix policy virtual + drift docs)`.

---

## Sub-bloco [2.D] — Superfície publicada e docs de contrato 📣

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-B02]`
> **Objetivo:** garantir que help/docs/smoke referenciem `.governance/` como contrato real.

- [x] **2.D.1** Docs e help da CLI declaram `.governance/` como contrato canônico de longo prazo; `.ai-guidelines/` marcada como bridge legada explícita (sem alias mágico). Sites atualizados: `docs/cli/ai-guidelines-cli.md` (header com 📣 Contrato Governance-Driven; BR-CLI-EDITORIAL-02 corrige drift 2.C de `opt-in/<feature>.md` para `center/methodologies/`/`base/quality/`), `AGENTS.md` § Consumer Bootstrap, `README.md` § modo `mirror`, `cli/cli/args.mjs` `printHelp` (rodapé "Contrato Governance-Driven").
- [x] **2.D.2** Reservas canônicas em `.governance/`:
  - `intake/` (PRD/intake) — spec posterior `stakeholder-intake-pipeline`
  - `handoff/` — spec posterior `handoff-contracts-formalization`
  - `telemetry/` — spec posterior `framework-observability-dashboard`

  Declaradas como `RESERVED_GOVERNANCE_DIRS` em `src/domain/workspace/MigrationPlan.ts` e materializadas idempotentemente por `AdoptWorkspace.execute`. Drift guard novo: `ReservedDirsContract.test.ts` força conjunto exato `[intake, handoff, telemetry]`.

- [x] **2.D.3** Smoke/integration headers atualizados declarando bridge legada testada e referenciando débito de migração: `tests/smoke/{bin-shim,init-empty,update-managed-block}.test.mjs` + `tests/integration/cli.integration.test.mjs`. **Sem mudanças funcionais** — testes seguem afirmando o que a CLI mjs realmente faz (escreve em `.ai-guidelines/`); migração das asserções para `.governance/` é PR4 quando `AdoptWorkspace` for plugado.
- [x] **2.D.N** Pipeline verde: 130 ts + 267 mjs + build:rules sem churn.
- [x] **2.D.[DEBT-REVIEW]** `NEXT.md`: 2.A.5 (deprecation plan) **fechado** via declaração de contrato em `ARCHITECTURE.md` §C inv. 12 + §H; cutover técnico marcado para PR4. Novos débitos documentais registrados (docs/help legados, specs históricas pré-2.C, drift guard de reservas).
- [x] **2.D.[ARCHITECTURE]** `ARCHITECTURE.md`: §H ganhou entrada `.governance/{intake,handoff,telemetry}` como reservas canônicas (consumer-side) com cross-ref a especs posteriores; §C ganhou invariante 12 ("smoke = contrato `.governance/`" com bridge legada explícita até PR4); duplicação acidental em §H removida (relíquia das edits 2.C).
- [x] **2.D.[COMMIT]** `docs(spec-0021): contrato .governance + reservas canônicas`.

---

## Encerramento de PR2 (gate)

- [x] **2.[READY-FOR-REVIEW]** Só marcar “Ready” quando:
  - migrations com precedence/idempotência/rollback provados por testes
  - registry YAML com determinismo e schema guard (e decisão sobre comentários)
  - rules reorg atômico com `build:rules` verde
  - docs/smoke alinhados ao contrato `.governance/`

- [x] **2.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [x] **2.[MERGE]** Merge após gate humano.

---

# 🚧 Fase 3 — Executable Intelligence Runtime (PR3)

> **Âncoras:** `[DEC-0021-C01]`, `[DEC-0021-D01]`
> **Objetivo:** Living Documentation como projeção viva (AST + drift guard) + TemplateEngine por composição atômica com validação estrutural.

## [PR-MGMT] PR3

- [x] **3.[PR-MGMT.NEW-BRANCH]** Branch: `feat/spec-0021-pr3-executable-intelligence-runtime`.
- [ ] **3.[PR-MGMT.DESCRIPTION]** (6 seções obrigatórias).
- [ ] **3.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório.
- [ ] **3.[PR-MGMT.MERGE-CHAIN]** `yarn format ; yarn check ; yarn test:nova-cli` (+ comandos novos da fase).

---

## Sub-bloco [3.0] — Saneamento de Fundação (ADRs + taxonomia) 🧭

> **Âncoras:** `[DEC-0021-A02]`, `[DEC-0021-B04]`, `[DEC-0021-C01]`, `[DEC-0021-D01]`
> **Objetivo:** fechar decisões arquiteturais via ADRs locais antes do TDD e corrigir o naming `exploration` → `spike` (validado por pesquisa MECE em [`../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md`](../../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md)).
> **Regra:** este sub-bloco entra **antes** de 3.A; nenhum código de domínio é tocado em 3.A antes do 3.0 fechar.

### 3.0.A — Renomeação `exploration` → `spike` (ressalva textual a [DEC-0021-A02])

- [x] **3.0.A.1** Atualizar domínio: `WORK_ITEM_KINDS` em `src/domain/shared/types.ts`, `DenseKind` + `DENSE_KINDS` em `src/domain/work-item/WorkItem.ts`. `assertValidDraft` e helpers de integridade consomem os tipos via referência (sem string hardcoded); não exigiram edição.
- [x] **3.0.A.2** Atualizar testes: `Pillars.test.ts` (describe + it.each) e `Isolation.test.ts` (textos dos skips de `inicialização do workspace` e `item denso`) refletem o novo nome.
- [x] **3.0.A.3** Infraestrutura: `registrySchema.ts` consome `WORK_ITEM_KINDS` dinamicamente para construir o conjunto válido; nenhuma edição literal foi necessária. `UNKNOWN_KIND` continua estável.
- [x] **3.0.A.4** Docs canônicas atualizadas: `decision-brief.md` ganhou ressalva 2026-05-11 logo após a ressalva 2026-05-10 (item 2 da lista numerada preservado como evidência histórica da decisão de 2026-05-09); `plan.md` linha 26, `spec.md` linhas 35 e 55, `tasks.md` invariante #2 (linha 21), `ARCHITECTURE.md` glossário §3, `ARCHITECTURE-REFERENCE.md` §3.1 tabela + §3.1 lista por kind + §5 glossário (`DenseWorkItem`, `Dense item`).
- [x] **3.0.A.5** Pipeline verde após renomeação: `yarn test:nova-cli` → 130 passed, 15 skipped (zero regressão).

### 3.0.B — Redigir e revisar ADRs novas (lar canônico em `.core/governance/adrs/`)

- [x] **3.0.B.1** Criar diretório `.core/governance/adrs/` (antecipando consolidação proposta em 4.B.5 — ADRs novas nascem aqui; legadas em `/adrs/` migram em PR4).
- [x] **3.0.B.2** ADR `0001-taxonomy-mece-pillars` — **Work Items como Taxonomia MECE de Intenção de Saída**. Aceita 2026-05-11 com nota sobre disciplina humana exigida na promoção (proposal→spec) para evitar drift entre registry.yml e estado real.
- [x] **3.0.B.3** ADR `0002-coverage-state-enum` — **Outcomes em Artefatos Derivados são Enums Fechados com Mensagem Determinística**. Aceita 2026-05-11; consolida padrão já praticado em 7 enums anteriores.
- [x] **3.0.B.4** ADR `0003-drift-guard-bypass` — **Bypass Auditável de Contratos de CI via Diretivas Declarativas In-Code**. Aceita 2026-05-11 com sintaxe canônica `// <guard-id>:allow-drift until=YYYY-MM-DD ref=<ID> reason="..."` aplicável a múltiplos guards futuros (não só living-docs).
- [x] **3.0.B.5** ADR `0004-ast-only-extraction` — **Análise Estática AST como SSOT para Artefatos Derivados de Código**. Aceita 2026-05-11; telemetria runtime fica como camada aditiva opcional.
- [x] **3.0.B.6** ADR `0005-structural-validation` — **Separação entre Validação Semântica e Estética em Artefatos Gerados**. Aceita 2026-05-11; recipe é o contrato de validação (não objeto auxiliar) — reforçado em 3.E.0.
- [x] **3.0.B.7** Gate humano realizado pelo Arquiteto Líder em 2026-05-11; 5 ADRs aprovadas com 2 ajustes pontuais aplicados (0001 — disciplina humana na promoção; 0005 — recipe como contrato).

### 3.0.[DEBT-REVIEW]

- [x] **3.0.C — Tornar critério editorial "ADR é princípio perene" agnóstico de agente.** Regra runtime `[CORE-15]` adicionada a `.core/rules/top/agents-core.md` apontando para SSOT detalhada em `.core/governance/adrs/README.md` (cross-ref bidirecional). Memória local do Claude Code (`feedback_adr_as_principle.md`) apagada — repo é fonte canônica.
- [x] **3.0.[DEBT-REVIEW]** `NEXT.md` atualizado: renomeação `exploration` → `spike` aplicada em 2026-05-11; 5 ADRs Aceitas; `[CORE-15]` formalizada; auditoria preliminar das ADRs legadas marcada como tal. **Débito novo aberto:** auditoria estrutural de `.core/rules/top/` (fronteira `agents-core` vs `global-rules` faz sentido em escopo, mas naming pode confundir) — proposta para PR4 / 4.B.
- [x] **3.0.[ARCHITECTURE]** `ARCHITECTURE.md` glossário §3 + `ARCHITECTURE-REFERENCE.md` §3.1 tabela e lista, §5 glossário sincronizados com renomeação `spike`. §F roadmap referencia as 5 ADRs em `.core/governance/adrs/` em commit subsequente quando o roadmap for revisitado.
- [x] **3.0.[COMMIT]** `refactor(spec-0021): consolida sub-bloco 3.0 (exploration→spike, ADRs, CORE-15)`.

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

- [ ] **3.A.[DEBT-REVIEW]** `NEXT.md`: registrar/resolver débitos relativos a schema versioning e ordem determinística; débito 4 (glossário sem enforcement) revisitar se schema cruzar com glossário.
- [ ] **3.A.[ARCHITECTURE]** `ARCHITECTURE.md`: §B.1 PR3 ganha `LivingDocumentation`; §G glossário ganha `LivingDocsSchema`, `coverageState`, `schemaVersion`.
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

- [ ] **3.B.[DEBT-REVIEW]** `NEXT.md`: marcar débito 3 (Boundary Lock por regex) como elegível para migração AST agora que TS Compiler API existe; débito 4 (glossário) revisitar se extrator puder cruzar com §G.
- [ ] **3.B.[ARCHITECTURE]** `ARCHITECTURE.md`: §D Boundary Enforcement atualiza para AST; §B.1 PR3 ganha `RuleExtractor`; glossário ganha `AstRuleExtractor`, `SourceMap`.
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

- [ ] **3.C.[DEBT-REVIEW]** `NEXT.md`: registrar débitos de cobertura CI (jobs adicionais, custo de execução) e qualquer falso-positivo conhecido do drift guard.
- [ ] **3.C.[ARCHITECTURE]** `ARCHITECTURE.md`: §C ganha invariante sobre drift guard como gate de CI; §G glossário ganha `DriftGuard`.
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

- [ ] **3.D.[DEBT-REVIEW]** `NEXT.md`: registrar débitos sobre recipes legadas não cobertas; preparar marco de retirada do mirror legado (3.F).
- [ ] **3.D.[ARCHITECTURE]** `ARCHITECTURE.md`: §B.1 PR3 ganha `TemplateEngine`; §G glossário confirma `Recipe`, `Partial`, `slots[]`.
- [ ] **3.D.[COMMIT]** `feat(spec-0021): TemplateEngine (recipes + partials)`.

---

## Sub-bloco [3.E] — Validação estrutural do Markdown (semântica, não estética) 🧱

> **Âncoras:** `[DEC-0021-D01]`, ADR `.core/governance/adrs/0005-structural-validation.md`
> **Princípio guia (ADR 0005):** Recipe é o contrato de validação — não objeto auxiliar. A mesma recipe que descreve **como montar** o artefato declara **quais invariantes** ele precisa cumprir. Não há schema de validação separado.

### Contratos obrigatórios

- [ ] **3.E.0 [Recipe = contrato]** Schema da Recipe (definido em 3.D.1) **deve** declarar, no mesmo arquivo:
  - slots obrigatórios + ordem;
  - cardinalidade por slot (`required: true`, `minOccurrences`, `maxOccurrences`);
  - partials válidos por slot;
  - seções proibidas para o `artifactKind`.
    Validator consome essa declaração — não há fonte separada de invariantes. Adicionar gênero novo é editar a recipe correspondente, nunca código do validator.
- [ ] **3.E.1** Validar invariantes por `artifactKind` consumindo o que a recipe declara:
  - headings mandatórios
  - ordem de seções
  - blocos obrigatórios (ex.: Harness Lock em tasks)
  - proibir seções indevidas (ex.: “Stage 1” em artefato errado)

- [ ] **3.E.2** Validar coerência recipe/slots:
  - slot faltando => falha
  - partial inválido => falha
  - recipe que monta artefato que ela mesma rejeitaria => falha (auto-coerência)

- [ ] **3.E.3** Mensagens determinísticas com códigos estáveis (`STRUCT_MISSING_HEADING`, `STRUCT_OUT_OF_ORDER`, `STRUCT_FORBIDDEN_SECTION`, `STRUCT_PARTIAL_NOT_FOUND`, `STRUCT_RECIPE_SELF_INCONSISTENT`).

### Testes (obrigatórios)

- [ ] **3.E.4** Criar e passar:
  - `MarkdownStructuralValidation.test.ts`
  - `SlotCompleteness.test.ts`
  - `ForbiddenComposition.test.ts`

- [ ] **3.E.N** Pipeline verde.

- [ ] **3.E.[DEBT-REVIEW]** `NEXT.md`: registrar débitos sobre invariantes estruturais não cobertas por `artifactKind` (deixar lista explícita).
- [ ] **3.E.[ARCHITECTURE]** `ARCHITECTURE.md`: §C ganha invariante sobre validação estrutural por `artifactKind`; §G glossário ganha `MarkdownStructuralValidation`.
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
- [ ] **3.F.[DEBT-REVIEW]** `NEXT.md`: fechar débitos relativos a mirror legado; registrar qualquer caminho não migrado com warning + prazo.
- [ ] **3.F.[ARCHITECTURE]** `ARCHITECTURE.md`: §F roadmap reflete depreciação do mirror; §H convenções ganham nota sobre recipes como fonte canônica.
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
- [ ] **4.A.[DEBT-REVIEW]** `NEXT.md`: registrar débitos do catálogo (gêneros futuros mapeados mas não implementados).
- [ ] **4.A.[ARCHITECTURE]** `ARCHITECTURE.md`: §H convenções ganha referência ao `GOVERNANCE-CATALOG.md` como carrier canônico.
- [ ] **4.A.[COMMIT]** `docs(spec-0021): carrier híbrido (catálogo) + reservas de lar`.

---

## Sub-bloco [4.B] — Foundation vs ADR (fronteira híbrida explícita) 📜

> **Âncora:** `[DEC-0021-B04]`

- [ ] **4.B.1** Renomear/refatorar `.core/process/spec-foundation.md` para refletir governança (nome final decidido aqui).
- [ ] **4.B.2** Extrair decisões arquiteturais estáveis para ADRs:
  - critério de migração: “decisão estável/cross-spec”
  - foundation permanece processo vivo e constituição operacional

- [ ] **4.B.3** Atualizar links/cross-refs após renomeação.
- [ ] **4.B.4** Auditoria das ADRs históricas em `/adrs/` à luz do critério editorial "ADR é princípio perene, não revisitação datada" (formalizado em `.core/governance/adrs/README.md`):
  - Para cada ADR legada (0003, 0004, 0005, 0006, 0007, 0008, 0009): aplicar um dos três caminhos:
    - **(a) Reescrever como princípio.** Se a decisão subjacente ainda é arquiteturalmente relevante mas o documento está escrito como relatório de execução (cita "Spec X — Vaga Y", lista mudanças por arquivo), reescrever o corpo como princípio perene; spec original vira nota histórica de rodapé.
    - **(b) Rebaixar para nota histórica não-ADR.** Se o documento é primariamente narrativa de execução (ex.: "essas mudanças foram aplicadas"), mover para `.specify/specs/researchs/governance/` como nota histórica datada; remover da numeração de ADRs.
    - **(c) Arquivar como Superseded.** Se a decisão foi efetivamente substituída por princípio mais abrangente (caso candidato: 0004 absorvida por governança monolítica de 0008), marcar `Superseded by <ID>` com rationale.
  - Insumo inicial em [`../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md`](../../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md) §2 (marcado como **preliminar** — não decisão).
- [ ] **4.B.5** Consolidar `/adrs/` na arquitetura de informação:
  - Mover `/adrs/*.md` → `.core/governance/adrs/` (alinha com `.core/governance/ARCHITECTURE*.md`).
  - Atualizar cross-refs em `README.md`, `AGENTS.md`, MEMORY do agente, ADRs internas que se auto-referenciam.
  - Numeração legada (0003-0009) preservada para evitar quebra de referências históricas; novas ADRs do PR3 (0001-0005 locais) **renumeradas para 0010-0014** ao serem promovidas para o lar consolidado.
- [ ] **4.B.6** Reescrever `adrs/README.md` (hoje rotulado "ADRs de Prompt Engineering — Micro-Decisões", vocabulário pré-PR1):
  - Reflete fronteira híbrida `[DEC-0021-B04]`: ADR = decisão arquitetural estável cross-spec; foundation/process = constituição operacional viva.
  - Documenta critério de migração foundation→ADR (4.B.2) e ciclo de promoção ADR local→global no encerramento de spec.
- [ ] **4.B.N** Pipeline verde.
- [ ] **4.B.[DEBT-REVIEW]** `NEXT.md`: registrar débitos sobre decisões ainda misturadas entre foundation e ADR; marcar reclassificação 0003/0004 aplicada.
- [ ] **4.B.[ARCHITECTURE]** `ARCHITECTURE.md`: §I "Como contribuir" ganha entrada sobre critério de migração foundation→ADR; §H ganha referência a `.core/governance/adrs/` como lar canônico consolidado.
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
- [ ] **4.C.[DEBT-REVIEW]** `NEXT.md`: fechar débitos sobre referências quebradas a `.specify/`/`.ai-guidelines/`; registrar conteúdo de `/docs` que migrou vs foi depreciado.
- [ ] **4.C.[ARCHITECTURE]** `ARCHITECTURE.md`: §H atualiza para refletir cleanup; remover menções a `/docs` se não for mais lar canônico.
- [ ] **4.C.[COMMIT]** `docs(spec-0021): cleanup holístico de docs + ponteiros`.

---

## Sub-bloco [4.D] — Homologação final (contrato distribuído) ✅

> **Âncoras:** `[DEC-0021-A03]`, `[DEC-0021-C01]`, `[DEC-0021-D01]`

- [ ] **4.D.1** Smoke: validar instalação/execução headless e geração de artefatos sob `.governance/`.
- [ ] **4.D.2** Validar `registry.yml` como SSOT e markdown derivado coerente.
- [ ] **4.D.3** Validar living docs (geração + check) e drift guard.
- [ ] **4.D.4** Validar TemplateEngine (recipes/partials) gerando artefatos válidos.
- [ ] **4.D.N** Pipeline verde.
- [ ] **4.D.[DEBT-REVIEW]** `NEXT.md`: revisão final pré-merge — todo débito remanescente migra para `roadmap/backlog.md` ou vira issue (vide F.1).
- [ ] **4.D.[ARCHITECTURE]** `ARCHITECTURE.md`: snapshot final do roadmap (§F) marcando PR1–PR4 como ✅; estado pós-merge declarado.
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
