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

| PR      | Fase   | Domínios focais                                                            | Status                                                |
| ------- | ------ | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| **PR0** | Fase 0 | Setup + Stage 1 (Research/Brief/Gate)                                      | ✅ Merged                                             |
| **PR1** | Fase 1 | DDD Core (Domain/Policy/Registry in-memory) + UseCases (sem IO real)       | ✅ Merged                                             |
| **PR2** | Fase 2 | Topology (GovernanceWorkspace Strangler Fig + RulesEngine builder/runtime) | ✅ Merged                                             |
| **PR3** | Fase 3 | Intelligence (LivingDocumentation AST + TemplateEngine composition)        | [/] Active <!-- mudar para ✅ Merged após o merge --> |
| **PR4** | Fase 4 | Consolidation (carrier/placement + foundation/ADR + legacy cleanup)        | [ ] Pending                                           |

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
- [x] **3.[PR-MGMT.DESCRIPTION]** Descrição do PR preenchida com as 6 seções obrigatórias e PR4 mencionado para cutover + recipes completas + equivalência 1:1.
- [x] **3.[PR-MGMT.REVIEW-GATE]** Gate humano obrigatório e pipeline verde.
- [x] **3.[PR-MGMT.MERGE-CHAIN]** Comandos de validação executados: `yarn format`, `yarn check`, `yarn test:nova-cli`, `yarn living-docs:check`.

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

- [x] **3.A.1 [Schema v0]** Schema cravado em `src/domain/living-docs/LivingDocsEntry.ts`:
  - `ruleId` (string não-vazia)
  - `title` (string não-vazia — derivada do nome do `it`/`test` em 3.B)
  - `boundedContext` (string não-vazia)
  - `domain` (string não-vazia)
  - `source` ({ file, lineStart, lineEnd } com `lineStart <= lineEnd`)
  - `tags` (array de strings)
  - `coverageState` (`covered | pending | deprecated` — enum fechado, ADR 0002)
  - `bypass?` ({ until: YYYY-MM-DD, ref, reason ≥ 8 chars } — só em entries `deprecated`, ADR 0003)
  - `schemaVersion` (`v0`, enum fechado em `LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS` frozen)

- [x] **3.A.2 [Versioning]** Política, não framework de migração. `LIVING_DOCS_SCHEMA_VERSION` cravado como `"v0"`; `LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS` é frozen (Object.freeze). Adicionar valor exige PR dedicado + ADR de extensão (ADR 0002 §6). Migration utility só nasce quando v1 existir.
- [x] **3.A.3 [Determinismo]** `canonicalizeArtifact` produz forma estável:
  - entries ordenadas alfa lexicográfica por `ruleId` (sem locale-sensitive sort)
  - tags deduplicadas e ordenadas alfa
  - sem campos temporais (`generatedAt`/`timestamp`/`createdAt`/`updatedAt`) — determinismo absoluto, ADR 0004 §2
  - idempotência testada (`JSON.stringify(canonicalize(canonicalize(x))) === JSON.stringify(canonicalize(x))`)

- [x] **3.A.4 [Path]** Path canônico já declarado em `decision-brief.md` A03 e ADR 0004: `.governance/living-docs.yml`. Materialização do path entra junto com a serialização YAML em PR3.B/3.C (infrastructure layer).

### Testes (obrigatórios)

- [x] **3.A.5** Criados e verdes:
  - `LivingDocsSchema.test.ts` (16 testes — schema + coverageState enum + bypass + duplicate rule id)
  - `LivingDocsDeterminism.test.ts` (8 testes — ordenação por ruleId, tags, idempotência, ausência de timestamps, estabilidade byte-a-byte)
  - `LivingDocsVersioning.test.ts` (10 testes — constante v0, conjunto frozen, rejeição de versões fora do conjunto)

- [x] **3.A.N** Pipeline verde: `yarn format ; yarn check ; yarn test:nova-cli` → 176 passed (130 prévios + 46 novos), 15 skipped, 0 falhas.

- [x] **3.A.[DEBT-REVIEW]** `NEXT.md`: registrar implementação do schema v0; nenhum débito novo aberto. Débito 4 (glossário sem enforcement) permanece — schema do living-docs não cruza glossário diretamente; revisar quando AST extractor em 3.B cruzar `boundedContext`/`domain` com termos do ARCHITECTURE-REFERENCE §5.
- [x] **3.A.[ARCHITECTURE]** `ARCHITECTURE-REFERENCE.md`: §1.3 ganhou tabela "Implementados — PR3" com `LivingDocumentation`; §1.4 mantém `TemplateEngine` como reservado; §2 ganhou invariante 13 (canonicalização + sem timestamps); §5 glossário ganhou `LivingDocsEntry`, `LivingDocsArtifact`, `CoverageState`, família `LIVING_DOCS_*`, constante `LIVING_DOCS_SCHEMA_VERSION`.
- [x] **3.A.[COMMIT]** `feat(spec-0021): living docs schema v0 + canonicalize determinístico`.

---

## Sub-bloco [3.B] — AST extraction (sem regex frágil) + source mapping 🧬

> **Âncora:** `[DEC-0021-C01]`

### Contratos obrigatórios

- [x] **3.B.1 [AST-first]** Extração via TypeScript Compiler API raw (sem regex sobre source). Walker reconhece `CallExpression` cujo callee é `Identifier("it"|"test")` ou `PropertyAccessExpression("it.skip"|"test.skip")`; `[BR-CLI-*]` extraído da `arguments[0]` StringLiteralLike. Sem `ts-morph` (uma dependência a menos).
- [x] **3.B.2 [Source mapping]** `source.file` em path POSIX relativo ao `repoRoot`; `lineStart`/`lineEnd` 1-indexed inclusivos via `sourceFile.getLineAndCharacterOfPosition`. Tags acumulam labels de `describe` ancestrais (top-down).
- [x] **3.B.3 [False positives]** Filtro **estrutural** por construção (walker só inspeciona `arguments[0]` de `it`/`test` em `.test.ts`). 11 testes negativos congelam a invariante: IDs em JSDoc, comentários inline, strings de produção (`console.log`, atribuição a variável), arquivos `.fixture.ts`/`.ts` comuns, template literals com interpolação, e padrões com prefixos não-canônicos são todos ignorados sem erro.
- [x] **3.B.4 [Coverage semantics]** `coverageState` derivado sintaticamente: `it`/`test` puro → `covered`; `it.skip`/`test.skip` → `pending`. `deprecated` virá em 3.C com o parser de diretiva de bypass.

### Implementação

- [x] **3.B.5** `RuleExtractor` implementado em duas camadas:
  - Port `src/app/ports/RuleExtractor.ts` (interface fina).
  - Adapter `src/infrastructure/ast/TypeScriptRuleExtractor.ts` (TS Compiler API).
  - Boundary preservado: package `typescript` só importável sob `src/infrastructure/ast/`.
  - `boundedContext`/`domain` derivados por convenção de path `src/<layer>/<bc>/<File>.test.ts`.
  - Escrita do artefato fica para 3.C (drift guard) ou infraestrutura YAML quando store ganhar IO.

### Testes (obrigatórios)

- [x] **3.B.6** Criados e verdes (32 novos):
  - `AstRuleExtractor.test.ts` (12) — descoberta de IDs, variants it/test/skip, ordem, convenção de path, erro `LIVING_DOCS_EXTRACTOR_FILE_NOT_FOUND`, output validado pelo `assertValidEntry` do domain.
  - `RuleExtractorSourceMap.test.ts` (9) — POSIX path, line ranges 1-indexed, multi-linha, tags via describes aninhados, irmãos isolados, determinismo byte-a-byte.
  - `RuleExtractorFalsePositives.test.ts` (11) — JSDoc, comments inline, strings de produção, atribuição a variável, arquivos não-test, fixtures, template literals com interpolação, padrões não-canônicos, mix realista.

- [x] **3.B.N** Pipeline verde: `yarn format ; yarn check ; yarn build:rules ; yarn test:nova-cli` → 208 passed (130+46+32), 15 skipped, 0 falhas, 0 regressão.

- [x] **3.B.[DEBT-REVIEW]** `NEXT.md`: débito 3 (Boundary Lock por regex) atualizado — TS Compiler API agora está instanciada, migração natural fica como sub-débito de 4.B; débito 4 (glossário) sem mudança neste sub-bloco (extrator cruza paths, não termos do glossário).
- [x] **3.B.[ARCHITECTURE]** `ARCHITECTURE-REFERENCE.md`: §1.3 PR3 ganhou `RuleExtractor` (port + adapter); §5 glossário ganhou `RuleExtractor`, `TypeScriptRuleExtractor`, `LIVING_DOCS_EXTRACTOR_FILE_NOT_FOUND`.
- [x] **3.B.[COMMIT]** `feat(spec-0021): AST extractor de BR-CLI (base + source mapping + false positives guard)`.

---

## Sub-bloco [3.C] — Drift guard (CI) + definição formal de drift 🧨

> **Âncora:** `[DEC-0021-C01]`

### Definição formal de drift (obrigatória)

- [x] **3.C.1** Drift formalizado nos use cases (`CheckLivingDocs`) e nos testes:
  - teste ativo com `[BR-CLI-*]` sem entrada no artefato gerado → `CHECK-02`
  - ID renomeado sem atualização do artefato → `CHECK-03`
  - artefato gerado divergente do repositório (vazio ou ausente) → `CHECK-04`, `CHECK-05`, `CLI-07`, `CLI-08`
  - mudança de ordenação/serialização que cause churn artificial → impossível por construção (canonicalize + serialize são determinísticos; testes `SERIALIZER-03`, `GENERATE-05`, `CHECK-07`, `CLI-04` congelam a invariante)

- [x] **3.C.2** Mecanismo de falha:
  - `GenerateLivingDocs` produz artifact canonicalizado + validado
  - `serializeLivingDocs` produz YAML byte-a-byte estável
  - `CheckLivingDocs` compara `serialize(generate())` com `committedYaml` lido; retorna `{ drift, diff, generatedYaml, artifact }`
  - `runCheck` (CLI) traduz drift em exit code 1 + stderr legível + hint para `yarn living-docs:generate`
  - **Bypass expirado** durante geração lança `LIVING_DOCS_BYPASS_EXPIRED` (ADR 0003) — drift guard nunca passa silencioso sobre bypass vencido.

### Implementação

- [x] **3.C.3a** Parser de diretiva de bypass `// living-docs:allow-drift until=YYYY-MM-DD ref=ID reason="..."` em `src/domain/living-docs/BypassDirective.ts` (ADR 0003). Integrado ao `TypeScriptRuleExtractor` para enriquecer entries `deprecated`.
- [x] **3.C.3b** Serializador YAML determinístico em `src/infrastructure/yaml/livingDocsSerializer.ts`. Funções puras `serializeLivingDocs` e `parseLivingDocs`.
- [x] **3.C.3c** Use cases `GenerateLivingDocs` e `CheckLivingDocs` em `src/app/use-cases/`. Port novo `LivingDocsSerializer` em `src/app/ports/` para preservar boundary (Check não importa infra direto).
- [x] **3.C.3d** Entrypoint CLI em `src/cli/livingDocs.ts` exportando `runGenerate(opts)`, `runCheck(opts)`, `discoverTestFiles(repoRoot)`. Smoke tests garantem contrato observável (exit code, stderr, idempotência).
- [x] **3.C.4** Bin `cli/living-docs.mjs` + yarn scripts `living-docs:generate` / `living-docs:check` + integração CI. **Concluído em 2026-05-11** após resolução completa de todos os gates expostos pela primeira execução e2e (sub-blocos `[3.C.4-prep]` agregação por ruleId, `[3.C.4-prep-fix]` reconhecimento de `it.each`/`test.each`, e `[3.C.4]` plumbing operacional). Estado final:
  - **Bin físico** materializado em `cli/living-docs.mjs` (commit `fff329e`), Windows-compatible.
  - **Yarn scripts** `living-docs:generate` / `living-docs:check` em `package.json` (commit `2ade096`).
  - **Baseline versionado** em `.governance/living-docs.yml` com 157 entries, ~93KB, schema v0 com `evidence[]` plural (commit `2ade096`).
  - **CI integrado** em `.github/workflows/ai-guidelines-ci.yml` via step `Validate Living Documentation drift guard` no job `ai-guidelines-check` — mesmo job que o baseline `yarn check`, reaproveitando setup. Harness Lock garantido: drift textual, ambiguidade estrutural (5 falhas fatais da invariante 14) ou bypass expirado fazem CI quebrar com mensagem listando o `ruleId` e hint para `yarn living-docs:generate`.

### Testes (obrigatórios)

- [x] **3.C.5** Criados e verdes (46 novos no sub-bloco 3.C inteiro):
  - `BypassDirective.test.ts` (16) — parser puro: reconhecimento, parsing válido, campos obrigatórios, expiração estrita, filtro por guard-id.
  - `RuleExtractorBypass.test.ts` (9) — integração extractor × directive: coverageState=deprecated, JSDoc/comentário inline, default preservado, erros estáveis repropagados.
  - `livingDocsSerializer.test.ts` (9) — serialização determinística, bypass block, sem timestamps, round-trip seguro.
  - `GenerateLivingDocs.test.ts` (5) — orquestração: canonicalize, bypass preservado, duplicate rule id repropagado, determinismo.
  - `CheckLivingDocs.test.ts` (7) — drift detection: sem drift / com drift / artifact vazio / regra removida / output enriquecido / determinismo.
  - `cli/livingDocs.test.ts` (8) — `discoverTestFiles`, `runGenerate`, `runCheck` (exit codes + stderr + idempotência).

- [x] **3.C.N** Pipeline verde: `yarn format ; yarn check ; yarn test:nova-cli` → 262 passed (208 prévios + 54 novos do 3.C entre código e testes), 15 skipped, 0 falhas, 0 regressão.

- [x] **3.C.[DEBT-REVIEW]** `NEXT.md`: registra (i) bin físico + yarn scripts dependem de saneamento do `ruleZone.ts` (débito pré-existente); (ii) integração CI fica para mesmo passo do bin; (iii) nenhum falso-positivo conhecido do drift guard (testes congelam comportamento estrutural).
- [x] **3.C.[ARCHITECTURE]** `ARCHITECTURE-REFERENCE.md`: §1.3 PR3 ganha `BypassDirective`, `LivingDocsSerializer` (port + adapter), `GenerateLivingDocs`, `CheckLivingDocs` e `livingDocs` (CLI); §2 ganha invariante 14 sobre drift guard como gate determinístico; §5 glossário ganha família.
- [x] **3.C.[COMMIT]** Quebrado em 3 commits atômicos: `feat(spec-0021): parser de bypass directive (ADR 0003) + integração extractor`, `feat(spec-0021): living docs serializer YAML + use case GenerateLivingDocs`, `feat(spec-0021): CheckLivingDocs + CLI module (drift guard)`.

---

## Sub-bloco [3.C.4-prep] — Agregação por ruleId no Living Docs (destrava 3.C.4) 🧬

> **Âncora:** `[DEC-0021-C01]` (continuação) · **Auditoria:** [`./audit-2026-05-11-pre-3c4-living-docs-aggregation.md`](./audit-2026-05-11-pre-3c4-living-docs-aggregation.md)

### Decisões fundadoras (cravar antes do TDD)

- [x] **3.C.4-prep.0a** **Schema evoluído in-place sob `v0`.** Justificativa documentada na auditoria §"Por que não bumpamos". A constante `LIVING_DOCS_SCHEMA_VERSION === "v0"` permanece; mudanças de shape do entry são honestas porque `v0` nunca chegou a consumidor externo. Testes `BR-CLI-LIVING-DOCS-VERSIONING-01..06` ficam **verdes sem alteração**.
- [x] **3.C.4-prep.0b** **Erros novos com códigos estáveis:** `LIVING_DOCS_INCONSISTENT_DEPRECATION`, `LIVING_DOCS_BYPASS_DIVERGENT`, `LIVING_DOCS_RULE_CROSS_FILE`. `LIVING_DOCS_DUPLICATE_RULE_ID` deixa de ser emitido (sem release pública dependendo do código — pre-1.0).
- [x] **3.C.4-prep.0c** **Coerência cross-file é erro fatal**, não permissivo. Uma rule só pode viver em UM arquivo `.test.ts`. (Decisão revertível se a dor aparecer; conservadora por design.)

### TDD em 4 passos atômicos (cada um = 1 commit)

- [x] **3.C.4-prep.1 [Domain — schema]** Reescrever `LivingDocsEntry`:
  - Substituir `source: LivingDocsSource` por `evidence: readonly LivingDocsSource[]` (cardinalidade ≥ 1).
  - `LivingDocsSource` ganha campos: `testName: string` (título do `it` sem o `[BR-CLI-*]`), `coverageState: CoverageState`, `bypass?: LivingDocsBypass`.
  - `LivingDocsEntry` mantém `coverageState` no topo (fusão; ver 3.C.4-prep.2) e `bypass` opcional no topo (só quando todos evidence concordam).
  - `assertValidEntry` valida: cada item de `evidence[]` tem source válido + testName não-vazio; `bypass` no topo só com `coverageState === "deprecated"`.
  - Testes afetados: `LivingDocsSchema.test.ts` SCHEMA-04 (campo `evidence` no lugar de `source`), SCHEMA-05/06/07 (validação migra para items de evidence), SCHEMA-08..12 (bypass continua, mas testa agora também a regra de convergência entre evidence[*].bypass).
  - Novos testes: validade de `evidence[]` vazio → erro; cardinalidade ≥ 1.
  - Commit: `feat(spec-0021): schema v0 ganha evidence[] (1 rule → N evidências) [BR-CLI-LIVING-DOCS-SCHEMA]`

- [x] **3.C.4-prep.2 [Domain — canonicalize + fusão]** Reescrever `canonicalizeArtifact`:
  - Agora **agrupa entries cruas por `ruleId`** antes de validar.
  - Ordena `evidence[]` de cada entry agregada por `(file, lineStart)` ascendente.
  - Fusão de `coverageState`:
    - Existe ≥1 `evidence[*].coverageState === "covered"` → entry.coverageState = `"covered"`.
    - Nenhum covered, ≥1 pending → `"pending"`.
    - Todos `"deprecated"` → `"deprecated"` (entry.bypass = bypass convergido).
    - Mistura `deprecated` ⊕ `covered`/`pending` → `LIVING_DOCS_INCONSISTENT_DEPRECATION`.
  - Bypass convergente: todas `evidence[*].bypass` precisam coincidir em `(until, ref, reason)`. Divergência → `LIVING_DOCS_BYPASS_DIVERGENT` listando os valores.
  - Coerência cross-file: se evidence[*] referencia mais de um `file`, `LIVING_DOCS_RULE_CROSS_FILE` listando os files.
  - `assertValidArtifact` deixa de rejeitar duplicate (que agora é impossível pós-agregação) — invariante "ruleId único no artifact" continua, só que satisfeita por construção.
  - Tags: união de todos `describe`-stacks de `evidence[*]`, deduplicadas e ordenadas alfa (já existia para tags por entry; agora vira união cross-evidence).
  - Testes afetados: `LivingDocsDeterminism.test.ts` — DETERMINISM-01/02 (ordenação por ruleId) inalterado; DETERMINISM-03/04/05 (tags) ajustado para união cross-evidence; DETERMINISM-06/07/08 inalterado.
  - Novos testes: agregação produz 1 entry para N evidências mesmo ruleId; fusão de coverageState (matriz 4 casos); bypass convergente vs divergente; cross-file → erro.
  - `LivingDocsSchema.test.ts` SCHEMA-14 (`duplicate ruleId`) reescrito: agora afirma que `assertValidArtifact` aceita o output canonicalizado (que nunca tem duplicate). O _caminho_ dup é capturado pelo `canonicalize`, não pelo `assertValid`.
  - Commit: `feat(spec-0021): canonicalize agrega 1-rule-N-evidências com fusão de coverageState`

- [x] **3.C.4-prep.3 [Infra — extractor]** Ajustar `TypeScriptRuleExtractor`:
  - **Dentro de cada arquivo**, agrupa por ruleId antes de retornar (extractor não precisa ver outros arquivos; cross-file é problema do domain).
  - Cada `it` encontrado vira um `LivingDocsSource` em `evidence[]` (com testName, coverageState, bypass próprios).
  - Saída: 1 entry por ruleId por arquivo. Se dois arquivos têm o mesmo ruleId, o extractor emite 2 entries — `canonicalizeArtifact` agrupa e dispara `LIVING_DOCS_RULE_CROSS_FILE`.
  - Testes afetados: `AstRuleExtractor.test.ts` EXTRACTOR-01..12 — output passa de N entries para 1 entry com N evidence (semântica unchanged, shape muda).
  - Testes afetados: `RuleExtractorSourceMap.test.ts` SOURCEMAP-04 — múltiplos it() de **ruleIds diferentes** ainda produz N entries; **mesmo ruleId** produz 1 entry com N evidence.
  - Testes afetados: `RuleExtractorBypass.test.ts` — bypass continua reconhecido por `it`, mas agora aparece em `evidence[i].bypass`.
  - Commit: `feat(spec-0021): extractor agrupa por ruleId dentro do arquivo`

- [x] **3.C.4-prep.4 [App — use cases + serializer]** Conectar a casca app:
  - `GenerateLivingDocs.execute`: nenhuma mudança lógica — `extractor.extract()` retorna entries (já agrupadas por arquivo), `canonicalizeArtifact` agrupa cross-file e funde, `assertValidArtifact` valida.
  - `GenerateLivingDocs.test.ts` GENERATE-04 reescrito: já não testa "propaga DUPLICATE_RULE_ID"; passa a testar "propaga `LIVING_DOCS_RULE_CROSS_FILE` quando há cross-file".
  - `livingDocsSerializer.ts` ajustado para o novo shape: emite `evidence:` como lista de mapas com `file/lineStart/lineEnd/testName/coverageState[/bypass]`. Ordem canônica de chaves preservada.
  - `livingDocsSerializer.test.ts` ajustado.
  - `CheckLivingDocs.test.ts` fixtures atualizadas; lógica do diff inalterada (continua byte-a-byte sobre o YAML serializado).
  - `cli/livingDocs.test.ts` smoke — fixtures atualizadas; contrato observável idêntico.
  - **Validação end-to-end:** rodar `node dist/cli/livingDocs.js generate` (via bin reescrito da sessão anterior, agora destravado) contra a árvore real. Deve produzir `.governance/living-docs.yml` sem erro. **Decisão de versionar baseline volta a ser questão aberta para 3.C.4 (NÃO esta sessão).**
  - Commit: `feat(spec-0021): use cases e serializer absorvem schema agregado + e2e validado`

---

## Sub-bloco [3.C.4-prep-fix] — Extractor reconhece it.each/test.each 🔍

> **Âncora:** `[DEC-0021-C01]`

### TDD em 2 passos (RED → GREEN, commit único)

- [x] **3.C.4-prep-fix.1 [RED]** Adicionar testes vermelhos em `AstRuleExtractor.test.ts`:
  - `EXTRACTOR-15`: `DADO it.each([...])(title, fn) ENTÃO reconhece ruleId como covered`.
  - `EXTRACTOR-16`: `DADO test.each([...])(title, fn) ENTÃO reconhece ruleId como covered`.
  - Rodar `yarn test:nova-cli` — esperado **fail** nesses 2 testes.

- [x] **3.C.4-prep-fix.2 [GREEN]** Extender `classifyTestCall` em `TypeScriptRuleExtractor.ts`:
  - Reconhecer `CallExpression` cujo `expression` é outro `CallExpression` cujo `expression` interno é `PropertyAccessExpression(it|test, each)`.
  - `lineRangeOf` continua operando sobre o `outer call` — `getStart()` aponta para `it`/`test`; `getEnd()` para o `)` final.
  - Rodar `yarn test:nova-cli` — esperado **green** (todos passando).

### Validação e2e

- 1 commit: `feat(spec-0021): extractor reconhece it.each/test.each (drift guard sem cegueira sintática)`.

---

## Sub-bloco [3.C.4] — Bin já materializado: yarn scripts + baseline + CI 🚀

> **Âncora:** `[DEC-0021-C01]` (continuação) · **Predecessores:** `[3.C.4-prep]` e `[3.C.4-prep-fix]` fecharam o gate de design e o ponto cego do `it.each`. Pipeline e bin físico já verdes ponta-a-ponta.
>
> **Estado atual em 2026-05-11:**
>
> - `cli/living-docs.mjs` materializado (commit `fff329e`), Windows-compatible via `pathToFileURL`.
> - `node cli/living-docs.mjs generate` → exit 0, 157 entries.
> - `node cli/living-docs.mjs check` → exit 0 ("in sync").
> - Idempotência byte-a-byte confirmada (MD5 `4fd426fa...`).
> - 292 testes passados, 0 regressão.
>
> **Falta:** casca operacional (yarn scripts), versionamento do baseline e integração CI dedicada. Trabalho de plumbing — sem decisões arquiteturais novas.

### Tarefas

- [x] **3.C.4.1 [Yarn scripts]** Adicionar ao `package.json` (seção `scripts`):
  - `"living-docs:generate": "yarn build && node cli/living-docs.mjs generate"`
  - `"living-docs:check": "yarn build && node cli/living-docs.mjs check"`
  - Validar manualmente: `yarn living-docs:generate` produz output `✅ ... written (157 entries).`; `yarn living-docs:check` retorna `✅ ... in sync (157 entries).`.
  - Justificativa do `yarn build &&`: garante que `dist/cli/livingDocs.js` está em sincronia com o source antes da execução. Em ambiente CI o build já roda separadamente, mas a redundância é barata e protege execução manual local.

- [x] **3.C.4.2 [Baseline versionado]** Versionar `.governance/living-docs.yml` no repo.
  - **Decisão técnica fundadora:** sem baseline no git, `check` compara contra string vazia e drift é trivial-sempre — o guard só faz sentido com baseline commitado. Versionar é caminho único.
  - **Tamanho atual:** 157 entries, ~92KB, ~2200 linhas. Diff em PRs futuros vai incluir mudanças sempre que um teste `[BR-CLI-*]` for adicionado/renomeado/removido — esperado e desejado.
  - **Localização:** `.governance/living-docs.yml` (já é o path canônico declarado em ADR 0004 e usado por `cli/livingDocs.ts`).
  - **Header de comentário no YAML?** Hoje o serializer não emite comentários (sortMapEntries:false + plain strings); adicionar header exigiria mudança no serializer. **Decisão:** não adicionar header agora — o arquivo é compreensível pela estrutura (`schemaVersion`/`entries`); evolução cosmética pode entrar em uma sessão de polish futura.
  - **Aprovação editorial necessária da owner antes do `git add`** (o arquivo é grande e fica visível no diff de toda PR futura).

- [x] **3.C.4.3 [CI integration]** Adicionar step em `.github/workflows/ai-guidelines-ci.yml`:
  - Novo step após o `Validate AI-first baseline`: `Validate Living Documentation` rodando `yarn living-docs:check`.
  - O step usa o mesmo job `ai-guidelines-check` (sem novo job — economiza setup de Node).
  - O step pressupõe que o baseline está commitado (3.C.4.2 fecha primeiro).
  - Não há diff específico no `package-lock` / setup; só uma linha nova de step. Validação local: `cat .github/workflows/ai-guidelines-ci.yml` — YAML válido + step na ordem certa.

- [x] **3.C.4.4 [Fechamento]** Housekeeping:
  - `tasks.md` 3.C.4 (item no sub-bloco [3.C]) marcado `[x]` com referência aos commits 3.C.4-prep + 3.C.4-prep-fix + este sub-bloco.
  - `NEXT.md` item 5 e 6: bin físico e CI marcados como ~~resolvidos~~.
  - `ARCHITECTURE-REFERENCE.md` §1.3 LivingDocsDriftGuard: trocar `"Bin físico materializado; yarn scripts + CI ficam para 3.C.4"` por `"Pipeline operacional completo (yarn scripts + CI integrado)"`.
  - 1 commit final cobrindo os 3 itens de plumbing + housekeeping (ou 3 commits atômicos se preferir).

### Critério de aceite (Definition of Done)

- `yarn living-docs:generate` e `yarn living-docs:check` rodam com exit 0 a partir do shell local.
- `.governance/living-docs.yml` versionado no repo após aprovação editorial da owner.
- Workflow CI executa `yarn living-docs:check` com sucesso em uma run real (verificada via `gh run watch` ou similar — opcional, pode ser via push para PR).
- Pipeline canônico (`yarn format ; yarn check ; yarn test:nova-cli`) continua 292 passed, 0 regressão.
- `tasks.md` 3.C.4 fechado; NEXT.md débitos 5 e 6 resolvidos; ARCHITECTURE-REFERENCE atualizado.

### Anti-objetivos (não fazer nesta sessão)

- Não evoluir o serializer para emitir header de comentário, mesmo que tentador (fica para sessão de polish).
- Não criar um job CI separado para living-docs (custo desnecessário; cabe no job existente).
- Não consolidar/renumerar IDs no `.governance/living-docs.yml` por estética (essa é decisão do autor do teste, não do drift guard).
- Não tocar em 3.D — sub-bloco próprio, escopo isolado.

---

## Sub-bloco [3.D] — TemplateEngine: schema de recipes + partials atômicos 🧩

> **Âncora:** `[DEC-0021-D01]`

### Contratos obrigatórios

- [x] **3.D.1 [Recipes schema]** Schema declarativo em `src/domain/templates/Recipe.ts` — 5 enums fechados (`TEMPLATE_SCHEMA_VERSIONS`, `ARTIFACT_KINDS`, `WORKFLOW_TYPES`, `LANGUAGES`, `CANONICAL_ORDERS`), types puros (`RecipeSlot`, `RecipeInvariants`, `Recipe`), `assertValidRecipe` com 11 códigos de erro estáveis `RECIPE_*`. Opção (B) cravada. 35 testes TDD em `Recipe.test.ts` (BR-CLI-RECIPE-01..30). Commit `cd6ff4a`.

- [x] **3.D.2 [Partials contract]** Contrato em `src/domain/templates/Partial.ts` — `assertValidPartialMarkdown` com 3 códigos de erro (`RECIPE_PARTIAL_INVALID_MARKDOWN`, `RECIPE_PARTIAL_HAS_PLACEHOLDER`, `RECIPE_PARTIAL_HAS_TIMESTAMP`). Sem parser externo de Markdown — checagem estrutural por regex para code blocks não-fechados, placeholders fora de code blocks ({{, <%=, ${}) e timestamps embutidos (generatedAt/createdAt/updatedAt). 15 testes TDD em `Partial.test.ts` (BR-CLI-PARTIAL-01..15). Commit `30dff42`.

- [x] **3.D.3 [Determinismo]** Contrato byte-a-byte em `AssembleArtifact.test.ts` — teste `BR-CLI-ASSEMBLE-05` executa 2× e asserta igualdade estrita. Separador `\n\n` entre slots, trailing `\n` único. Commit `4802869`.

### Implementação

- [x] **3.D.4** Use case `AssembleArtifact` em `src/app/use-cases/AssembleArtifact.ts` — orquestra `loadRecipe` → `assertValidRecipe` → `loadPartial` (first-wins Q2) → `assertValidPartialMarkdown` → concatenação canônica. Port `RecipeStore` em `src/app/ports/RecipeStore.ts` (interface fina: `loadRecipe(name)`, `loadPartial(ref)`). Tipo de output `ComposedArtifact` em `src/domain/templates/ComposedArtifact.ts` (content + metadata). 100% coverage. 10 testes TDD em `AssembleArtifact.test.ts` (BR-CLI-ASSEMBLE-01..10). Commit `4802869`.

### Testes (obrigatórios)

- [x] **3.D.5** Testes entregues colocalizados (TDD red→green):
  - `Recipe.test.ts` (35 testes — schema, enums, slots, cardinalidade, invariants)
  - `Partial.test.ts` (15 testes — markdown válido, placeholders, timestamps)
  - `AssembleArtifact.test.ts` (10 testes — happy path, determinismo, erros propagados)

- [x] **3.D.N** Pipeline verde. 362 passed, 15 skipped, 0 failed. Living Docs: 167 → 222 entries. Drift guard verde.

- [x] **3.D.[DEBT-REVIEW]** `NEXT.md`: registrar débitos sobre recipes legadas não cobertas; preparar marco de retirada do mirror legado (3.F).
- [x] **3.D.[ARCHITECTURE]** `ARCHITECTURE.md`: §B.1 PR3 ganha `TemplateEngine`; §G glossário confirma `Recipe`, `Partial`, `slots[]`.
- [x] **3.D.[COMMIT]** 3 commits atômicos: `cd6ff4a` (Recipe), `30dff42` (Partial), `4802869` (AssembleArtifact + RecipeStore + ComposedArtifact).

---

## Sub-bloco [3.E] — Validação estrutural do Markdown (semântica, não estética) 🧱

> **Âncoras:** `[DEC-0021-D01]`, ADR `.core/governance/adrs/0005-structural-validation.md`
> **Princípio guia (ADR 0005):** Recipe é o contrato de validação — não objeto auxiliar. A mesma recipe que descreve **como montar** o artefato declara **quais invariantes** ele precisa cumprir. Não há schema de validação separado.

### Contratos obrigatórios

- [x] **3.E.0 [Recipe = contrato]** Confirmado — Recipe em `src/domain/templates/Recipe.ts` (3.D.1) declara slots obrigatórios + ordem, cardinalidade (`required`, `minOccurrences`, `maxOccurrences`), partials válidos por slot, e `forbiddenHeadings` por `artifactKind`. Validator em `StructuralValidation.ts` consome essa declaração sem fonte separada.

- [x] **3.E.1** Validação de `forbiddenHeadings` (case-sensitive) implementada em `validateComposedArtifact`. Headings mandatórios e ordem de seções ficam como débito v1 — exigem schema declarativo de headings na Recipe (bump de schemaVersion).

- [x] **3.E.2** Coerência recipe/slots: slot required faltando → `STRUCT_MISSING_SLOT`; metadata divergente → `STRUCT_RECIPE_SELF_INCONSISTENT`; validação acumula todos os erros.

- [x] **3.E.3** Mensagens determinísticas com 3 códigos estáveis: `STRUCT_FORBIDDEN_SECTION`, `STRUCT_MISSING_SLOT`, `STRUCT_RECIPE_SELF_INCONSISTENT`. Códigos planejados (`STRUCT_MISSING_HEADING`, `STRUCT_OUT_OF_ORDER`) adiados para v1.

### Testes (obrigatórios)

- [x] **3.E.4** Testes em `src/app/use-cases/StructuralValidation.test.ts` — 12 testes TDD (BR-CLI-STRUCT-01..12). `StructuralValidation.ts` com 100% coverage.

- [x] **3.E.N** Pipeline verde. 374 passed, 15 skipped, 0 failed. Living Docs: 222 → 234 entries.

- [x] **3.E.[DEBT-REVIEW]** `NEXT.md`: registrar débitos sobre headings mandatórios e ordem de seções (v1).
- [x] **3.E.[ARCHITECTURE]** `ARCHITECTURE.md`: §C ganha invariante sobre validação estrutural por `artifactKind`; §G glossário ganha `StructuralValidation`.
- [x] **3.E.[COMMIT]** Commit único com implementação + testes.

---

## Sub-bloco [3.F] — Retirada segura do mirror legado 🧯

> **Âncora:** `[DEC-0021-D01]`
> **Regra:** só remover mirror após equivalência mínima validada.

- [x] **3.F.1** Mapear equivalência mínima:
  - arquivos gerados pelo mirror atual vs pelo TemplateEngine
  - delta aceito (apenas o intencional)

- [x] **3.F.2** Criar testes de regressão de geração (snapshot determinístico).
- [-] ~~**3.F.3** Trocar fluxo padrão para recipes/partials.~~ _(Movido para 4.C.0, PR3 foca na depreciação formal)_
- [x] **3.F.4** Depreciar mirror com warning determinístico e prazo (se necessário).
- [x] **3.F.N** Pipeline verde.
- [x] **3.F.[DEBT-REVIEW]** `NEXT.md`: fechar débitos relativos a mirror legado; registrar qualquer caminho não migrado com warning + prazo.
- [x] **3.F.[ARCHITECTURE]** `ARCHITECTURE.md`: §F roadmap reflete depreciação do mirror; §H convenções ganham nota sobre recipes como fonte canônica.
- [x] **3.F.[COMMIT]** `refactor(spec-0021): remove mirror legado após equivalência (recipes)`.

---

## Encerramento de PR3 (gate)

- [x] **3.[READY-FOR-REVIEW]** Só marcar “Ready” quando:
  - schema v0 definido + determinismo provado
  - AST extractor funcional (sem regex) + source mapping
  - drift guard integrado ao CI
  - TemplateEngine monta + valida estruturalmente
  - mirror legado removido ou formalmente depreciado com regressão coberta

- [x] **3.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [x] **3.[MERGE]** Merge após gate humano.

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

- [x] **4.A.1** Criar `GOVERNANCE-CATALOG.md` (ou nome final) como carrier canônico curto:
  - classes/gêneros
  - paths canônicos
  - regras de lookup
  - lifecycle/responsabilidades

- [~] **4.A.2** Garantir consistência com a topologia real do repo (modelo híbrido):
  - se o catálogo diz X, o repo deve expressar X
  - **Status parcial:** o catálogo agora descreve o **destino** explicitamente E o **delta atual** (§6 Débitos de Transição). A consistência total (catálogo = repo sem deltas) só é alcançada quando 4.B.4/4.B.5 (ADRs) e 4.C.0/4.C.1 (cleanup `/docs/`, cutover CLI) fecharem. Item permanece aberto como auditoria final no encerramento do PR4.

- [x] **4.A.3** Reservar explicitamente paths de gêneros futuros em `.governance/`:
  - `intake/`
  - `handoff/`
  - `telemetry/`

- [x] **4.A.N** Pipeline verde.
- [x] **4.A.[DEBT-REVIEW]** `NEXT.md`: registrar débitos do catálogo (gêneros futuros mapeados mas não implementados).
- [x] **4.A.[ARCHITECTURE]** `ARCHITECTURE-REFERENCE.md`: §6 convenções ganha referência ao `GOVERNANCE-CATALOG.md` como carrier canônico.
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

- [ ] **4.C.0** Efetivar o cutover da CLI para o TemplateEngine:
  - Migrar os boilerplates legados (`.specify/templates/`) para recipes POJO/YAML + partials atômicos (equivalência 1:1).
  - Trocar o fluxo padrão da CLI para ler as recipes e parar de copiar os arquivos do mirror legado.

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
