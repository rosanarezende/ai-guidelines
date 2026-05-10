<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=3 -->

# Tasks — Spec 0021 Governance Information Architecture — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress (Stage 2)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `evidence-driven`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `evidence-driven` — i.e., o design depende de evidência técnica/pesquisa **ainda não coletada** (cf. `.core/process/spec-foundation.md` § "Tipos de spec"). A diferença canônica em relação ao boilerplate genérico é a expansão da **Fase 0** com Stage 1 (Research → Decision-Brief → Gate humano), executada **antes** da Implementação A. Stage 2 só inicia após o gate humano resolver todos os pontos `[DEC-NNNN-*]` do `decision-brief.md`.

---

## 📋 Estratégia de PRs — 5 Entregas Sequenciais

> Esta spec resultará em código substancial (~3000-3500 lines). Para facilitar review e respeitar o CORE-12 (checkpoints com aprovação humana), o trabalho foi reorganizado em **5 PRs sequenciais**, cada uma com escopo coeso e dependência clara da anterior.
>
> **Rationale**: Uma única mega-PR de 3500 linhas seria difícil de revisar atomicamente. Micro-PRs de ~200 linhas levariam a churn excessivo de merges. A estrutura de 5 PRs balanceia:
>
> - ✅ Coesão temática (cada PR aborda um domínio ou camada)
> - ✅ Dependências explícitas (PR2 depende de PR1, etc.)
> - ✅ Tamanho revisável (~500-1400 linhas por PR)
> - ✅ Gates de aprovação entre PRs para evitar retrabalho

| PR      | Fase      | Tamanho           | Descrição                                                   |
| ------- | --------- | ----------------- | ----------------------------------------------------------- |
| **PR0** | Fase 0    | Concluído         | Setup + Research + Decision-Brief + Gate (já em PR aberta)  |
| **PR1** | Fase 1    | ~500-700 linhas   | Fundação arquitetural: bounded contexts + TDD/BDD           |
| **PR2** | Fase 2    | ~800-1100 linhas  | Reestruturação física: estado + topologia + compatibilidade |
| **PR3** | Fases 3+4 | ~1050-1400 linhas | Automação + motor novo: living docs + composição modular    |
| **PR4** | Extra     | ~100-200 linhas   | Cleanup final: migração controlada + redirects              |

> **Fluxo**: PR1 → (human gate) → PR2 → (human gate) → PR3 → (human gate) → PR4 → (review final) → merge `main`

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> **Concluída.** O gate humano fechou em 2026-05-09. Esta fase permanece aqui como trilha de auditoria do lifecycle `evidence-driven`.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/spec-foundation.md` § "Tipos de spec".
- [x] **0.2** **Tipo de spec** confirmado como `evidence-driven` no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **sim**.
- [x] **0.3** **Slug semântico** definido: `governance-information-architecture`.
- [x] **0.4** Branch `feat/spec-0021-governance-information-architecture` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo with `Tipo de spec: evidence-driven` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [x] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprovou o problema e o escopo antes dos Code Actions.
- [x] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md` com bloco Stage 1 / Stage 2 e perguntas explícitas de research.
- [x] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [x] **0.9** `decision-brief.md` instanciado com pontos `[DEC-0021-*]` em status `Pendente`.
- [x] **0.10** `roadmap/backlog.md` atualizado: 0021 movida para "Em execução", preservando rastreabilidade editorial mínima da candidata original.
- [x] **0.11** `NEXT.md` instanciado (mandatório).
- [x] **0.[COMMIT]** texto de commit atômico sugerido: `chore(spec-0021): setup inicial da spec governance-information-architecture`.
- [x] **0.[PULL-REQUEST]** Criar Pull Request em Draft (usando o template do repositório, se aplicável).

### Sub-bloco [0.Research] — Stage 1: produzir researches

- [x] **0.R.1** Listar perguntas de research a responder em `plan.md`, cada uma cruzada com o ponto `[DEC-0021-*]` correspondente.
- [x] **0.R.2** Consolidar o pacote inicial de evidência usando os dois researches obrigatórios de 2026-05-08 e o backlog da candidata.
- [x] **0.R.3** Produzir research complementar quando o pós-gate evidenciou lacunas reais de implementação (`2026-05-09-post-gate-gap-analysis.md`).
- [x] **0.R.4** Análise de débitos e implicações técnicas incorporada ao replanejamento do Stage 2.
- [x] **0.R.[COMMIT]** texto de commit incremental sugerido: `research(spec-0021): sínteses Stage 1 publicadas`.

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

- [x] **0.B.1** Popular `[DEC-0021-A01]`, `[DEC-0021-A02]`, `[DEC-0021-A03]`, `[DEC-0021-B01]`, `[DEC-0021-B02]`, `[DEC-0021-B03]`, `[DEC-0021-B04]` e `[DEC-0021-B05]` com pergunta, contexto, opções e tradeoffs.
- [x] **0.B.2** Registrar recomendações iniciais quando já houver evidência convergente nos insumos de 2026-05-08.
- [x] **0.B.3** Publicar a tabela "Resumo de status" com todos os pontos em `Pendente`.
- [x] **0.B.4** Análise de débitos inicial registrada e depois expandida pelo pós-gate.
- [x] **0.B.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0021): decision-brief.md populado com opções Stage 1`.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **Fechado.** Stage 2 está autorizado.

- [x] **0.G.1** Owner revisou `decision-brief.md` com todos os pontos `[DEC-0021-*]`.
- [x] **0.G.2** Para cada ponto: owner escolheu opção, justificou e fechou status em `Resolved`.
- [x] **0.G.3** Perguntas que exigiram aprofundamento retornaram ao research antes do fechamento do gate.
- [x] **0.G.4** Status agregado do `decision-brief.md` mudou para `Resolved` com bloco final "✅ Gate fechado" assinado.
- [x] **0.G.5** `plan.md` passou a exigir v2 orientado pelas decisões cravadas.
- [x] **0.G.6** `tasks.md` passou a exigir v2 com Fases de Stage 2 reordenadas e aprofundadas.
- [x] **0.G.7** Replanejamento do Stage 2 aprovado pela owner antes dos edits nos artefatos.
- [x] **0.G.[COMMIT]** texto de commit atômico sugerido: `docs(spec-0021): gate humano fechado — plan v2 + tasks v2 publicados`.
- [x] **0.G.[PULL-REQUEST]** Atualizar PR com descrição focada em Stage 1 (contexto → perguntas de research → opções iniciais). O PR será marcado como "Ready for review", aguardando o fechamento do gate humano para Stage 2.
- [x] **0.G.[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**

---

## Fase 1 — Fundação arquitetural da nova CLI (DDD + TDD/BDD)

> Esta fase funda os domínios da nova CLI em um ambiente isolado (`src/`) usando TypeScript e Jest, sem modificar o código legado (`cli/`). A abordagem "Strangler Fig" garante uma transição segura e testável. O código legado continuará funcionando enquanto o novo domínio é construído e validado.
>
> **PR1**: Branch `feat/spec-0021-fase-1`, commits incrementais (1.0, 1.A, 1.B, 1.C, 1.D), merge após aprovação humana.

### Sub-bloco [1.0] — Setup Técnico (TypeScript + Jest)

- [x] **1.0.[NEW-BRANCH]** Branch `feat/spec-0021-fase-1` criada a partir de `main` (PR0 já mergeada).
- [x] **1.0.1** Adicionar dependências de desenvolvimento: `typescript`, `ts-node`, `jest`, `ts-jest`, `@types/node`, `@types/jest`.
- [x] **1.0.2** Criar `tsconfig.json` na raiz, configurado para ESM (`"module": "NodeNext"`) e output em `dist/`.
- [x] **1.0.3** Criar `jest.config.ts` na raiz, configurado para usar `ts-jest` e apontar para os testes em `src/`.
- [x] **1.0.4** Atualizar `package.json`: adicionar scripts `test:nova-cli` e `build` para the novo ambiente TS.
- [x] **1.0.5** Criar um teste de smoke (`src/smoke.test.ts`) para garantir que a configuração do Jest está funcionando.
- [x] **1.0.N** Pipeline de check + test verde após o sub-bloco 1.0.
- [x] **1.0.6** Análise de débitos: atualizar `NEXT.md`.
- [x] **1.0.[COMMIT]** Commit atômico sugerido: `chore(spec-0021): setup typescript e jest para nova cli`.

### Sub-bloco [1.A] — Governança por Blueprints (Living Documentation)

> Foco: Consolidar a suíte de testes como a Única Fonte da Verdade (SSOT) para as regras de negócio. Sanitizar o ambiente para garantir pureza arquitetural antes da implementação real.

- [x] **1.A.1** Centralizar e estruturar os blueprints de teste em `src/` seguindo as áreas de negócio: `domain/policy`, `domain/registry`, `domain/workspace`, `app/use-cases` e `infrastructure/filesystem`.
- [x] **1.A.2** Enriquecer os blueprints com as regras MECE dos 7 pilares, métricas de Growth, requisitos de incidentes e mensagens de erro específicas extraídas do `decision-brief.md` e da análise da CLI legada.
- [x] **1.A.3** **[Sanitização]** Deletar toda a implementação precoce em `src/` para garantir o ciclo RED -> GREEN sustentável e fundado em contratos puros.
- [x] **1.A.4** Validar a suíte de blueprints (`yarn test:nova-cli`) garantindo 100% de cobertura de regras em modo `it.skip`.
- [x] **1.A.5** Criar o `BLUEPRINT_STRUCTURE.md` como guia canônico para humanos e agentes navegarem pela governança técnica.
- [x] **1.A.N** Pipeline de check + test verde (com 100% de skips válidos).
- [x] **1.A.6** Análise de débitos: atualizar `NEXT.md`.
- [x] **1.A.[COMMIT]** Commit atômico realizado: `chore(spec-0021): pasta src sanitizada e blueprints enriquecidos com insights da implementação precoce`.

### Sub-bloco [1.B] — O Coração do Domínio (Entidades e Políticas Puras)

> Foco: Implementar o "Cérebro" da governança seguindo o **DDD Puro**. Sem IO, apenas lógica e tipos ricos que garantem a integridade dos 7 pilares (MECE) definidos em [DEC-0021-A02].

- [ ] **1.B.1** **[Linguagem Ubíqua]** Materializar as entidades em `src/domain/entities/` (Spec, Exploration, Fix, Patch, Incident, Proposal, Experiment). Cada uma deve refletir os atributos e restrições de [DEC-0021-A02] (ex: `Experiment` exige `hypothesis` e `successMetrics`).
- [ ] **1.B.2** **[Domain Brain]** Implementar o `GovernancePolicyService` como o oráculo das regras:
  - Validar transições de maturidade (ex: Proposal [review/done] -> Spec; Experiment [won] -> Spec).
  - Aplicar restrições MECE (Impedir campos de `experiment` em `patch`, garantir `severity` em `incident`).
  - Validar descritividade mínima (títulos e hipóteses com comprimento mínimo).
- [ ] **1.B.3** **[TDD / Ciclo GREEN]** Ativar os testes de `src/domain/policy/Pillars.test.ts` e `Promotion.test.ts`. O domínio deve atingir estado verde baseado em lógica pura em memória.
- [ ] **1.B.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.B.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): implementa coração do domínio e motor de políticas (Pure DDD)`.

### Sub-bloco [1.C] — Persistência Estruturada e Integridade (Registry SSOT)

> Foco: O `registry.yml` como fonte única de verdade (SSOT), conforme [DEC-0021-A01]. A persistência deve ser "human-friendly" para suportar Code Review.

- [ ] **1.C.1** **[YAML SSOT]** Implementar o `GovernanceRegistryService` garantindo:
  - Preservação de comentários manuais de governança (Vital para DEC-0021-A01).
  - Estabilidade de diff (ordem determinística dos itens para evitar churn em PRs).
  - Automatização de metadados de auditoria (`updatedAt`, imutabilidade de `id` e `createdAt`).
- [ ] **1.C.2** **[Schema Guard]** Implementar validação de schema rígida para evitar corrupção do estado estruturado.
- [ ] **1.C.3** **[TDD / Ciclo GREEN]** Ativar e passar os testes de `src/domain/registry/Integrity.test.ts`.
- [ ] **1.C.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.C.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): implementa registro estruturado com preservação de comentários (YAML SSOT)`.

### Sub-bloco [1.D] — Mapeamento Físico e Orquestração (App Layer)

> Foco: Conectar o domínio à infraestrutura. Aqui nasce a percepção física do workspace `.governance/`, conforme [DEC-0021-A03].

- [ ] **1.D.1** **[Infrastructure Adapter]** Implementar o `FileSystemAdapter` em `src/infrastructure/` com guardas de escopo estrito ao root `.governance/`.
- [ ] **1.D.2** **[Physical Mapping]** Implementar o `GovernanceWorkspaceService`:
  - Lógica de isolamento: diferenciar itens Densos (com pasta física) de Virtuais (apenas registro).
  - Inicialização das subpastas canônicas (specs, incidents, experiments, explorations).
- [ ] **1.D.3** **[Application Layer]** Implementar os Use Cases `RegisterWorkItem` e `PromoteWorkItem`:
  - Orquestração atômica: Validação -> Persistência YAML -> Criação Física.
  - **Lógica de Rollback**: Garantir que uma falha de disco não deixe o Registro em estado inconsistente.
- [ ] **1.D.4** **[BDD/TDD / Ciclo GREEN]** Ativar e passar os testes de `Isolation.test.ts` e as suítes em `src/app/use-cases/`.
- [ ] **1.D.N** Pipeline de check + test verde 100% para toda a Fase 1.
- [ ] **1.D.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.D.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): orquestração de casos de uso e mapeamento físico do workspace .governance/`.

### Encerramento de PR1 (Fundação Arquitetural)

- [ ] **1.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `feat(spec-0021): Fase 1 — Fundação Arquitetural (PR1)`.
- [ ] **1.[DESCRIPTION]** Descrever em 3 seções: (1) Governança por Blueprints (RED); (2) Domínio DDD fundado (GREEN); (3) Orquestração atômica e infra.
- [ ] **1.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de 1.D e pipeline verde.
- [ ] **1.[MANDATÓRIO]** Aguardar aprovação humana explícita do Maintainer. **Não fazer merge autonomamente.**
- [ ] **1.[MERGE]** Após aprovação, fazer merge com `yarn format ; yarn check ; git commit -m "..." ; ...`.

---

## Fase 2 — Topologia Física e Workspace (Governance-Driven)

> Esta fase materializa as decisões de placement e catálogo documental ([DEC-0021-B01 a B05]), utilizando o motor fundado na Fase 1 para mudar a realidade física do repositório.
>
> **PR2**: Branch `feat/spec-0021-fase-2`, commits incrementais (2.A, 2.B, 2.C), merge após aprovação humana.

### Sub-bloco [2.A] — GovernanceWorkspace (Root e Migração)

- [ ] **2.A.[NEW-BRANCH]** Branch `feat/spec-0021-fase-2` criada a partir de `main` (PR1 mergeada).
- [ ] **2.A.1** **[Strangler Fig]** Ativar o `GovernanceWorkspaceService` para gerenciar a migração automática de `.specify/` e `.ai-guidelines/` para `.governance/`.
- [ ] **2.A.2** **[Registry Bootstrap]** Popular o `registry.yml` com um lote representativo do legado, provando o modelo híbrido.
- [ ] **2.A.3** **[TDD / Ciclo GREEN]** Validar que a CLI prioriza o novo root mas mantém bridge de compatibilidade.
- [ ] **2.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.A.[COMMIT]** Commit sugerido: `refactor(spec-0021): introduz root .governance com lógica de migração strangler fig`.

### Sub-bloco [2.B] — RulesEngine (Topologia de Regras)

- [ ] **2.B.1** **[Rules Topology]** Reorganizar fisicamente `.core/rules/` seguindo a taxonomia (Top/Center/Base) conforme [DEC-0021-B05].
- [ ] **2.B.2** **[Build Alignment]** Atualizar `build:rules`, catálogos e scripts de compilação para suportar a nova topologia sem quebrar o runtime.
- [ ] **2.B.3** **[TDD / Ciclo GREEN]** Validar compilação e projeções com a nova estrutura física.
- [ ] **2.B.[COMMIT]** Commit sugerido: `feat(spec-0021): reorganiza .core/rules seguindo a nova taxonomia canônica`.

### Sub-bloco [2.C] — Placement Documental e Foundation

- [ ] **2.C.1** **[Catalog]** Criar o `GOVERNANCE-CATALOG.md` como carrier da política de AI ([DEC-0021-B03]).
- [ ] **2.C.2** **[Foundation Refactor]** Renomear `spec-foundation.md` para `governance-foundation.md`, refatorando o manual operacional para os 7 pilares.
- [ ] **2.C.3** **[ADR Migration]** Migrar decisões arquiteturais atômicas de foundation para ADRs conforme [DEC-0021-B04].
- [ ] **2.C.4** **[Cleanup]** Depreciar o diretório raiz `docs/` e redistribuir conteúdo útil.
- [ ] **2.C.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.C.[COMMIT]** Commit sugerido: `docs(spec-0021): consolida catálogo de governança e refatora foundation document`.

### Encerramento de PR2 (Topologia e Workspace)

- [ ] **2.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `feat(spec-0021): Fase 2 — Topologia Física e Workspace (PR2)`.
- [ ] **2.[DESCRIPTION]** Descrever: (1) Novo root .governance/; (2) Nova topologia de regras; (3) Catálogo e Foundation refatorada.
- [ ] **2.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de 2.C e pipeline verde.
- [ ] **2.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [ ] **2.[MERGE]** Após aprovação, fazer merge seguindo a chain em AGENTS.md.

---

## Fase 3 — Inteligência e Automação (Living Docs & Templates)

> A fase final entrega as capacidades avançadas de "Documentação Viva" e "Composição Modular" ([DEC-0021-C01 e D01]).
>
> **PR3**: Branch `feat/spec-0021-fase-3`, commits incrementais (3.A, 3.B), merge após aprovação humana.

### Sub-bloco [3.A] — LivingDocumentation (Gabarito Vivo)

- [ ] **3.A.[NEW-BRANCH]** Branch `feat/spec-0021-fase-3` criada a partir de `main` (PR2 mergeada).
- [ ] **3.A.1** **[Rule Extractor]** Implementar o serviço que extrai IDs `[BR-CLI-*]` das suítes de teste de Fase 1 via AST parsing ou Reporter.
- [ ] **3.A.2** **[Drift Guard]** Integrar a extração ao CI, garantindo que o artefato gerado em `.governance/` reflita 100% do comportamento real.
- [ ] **3.A.3** **[TDD / Ciclo GREEN]** Validar determinismo e falha por drift no pipeline.
- [ ] **3.A.[COMMIT]** Commit sugerido: `feat(spec-0021): ativa motor de living documentation extraído dos testes`.

### Sub-bloco [3.B] — TemplateEngine (Composição Atômica)

- [ ] **3.B.1** **[Recipe Engine]** Implementar o motor que monta documentos finais combinando `partials` baseados em `recipes` do domínio.
- [ ] **3.B.2** **[Atomic Partials]** Quebrar os boilerplates integrais (tasks, plan, spec) em blocos Markdown válidos e reutilizáveis.
- [ ] **3.B.3** **[Legacy Mirror Removal]** Substituir o espelhamento de arquivos inteiros pelo novo fluxo de montagem modular.
- [ ] **3.B.4** **[BDD/TDD / Ciclo GREEN]** Validar integridade estrutural do Markdown gerado.
- [ ] **3.B.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **3.B.[COMMIT]** Commit sugerido: `feat(spec-0021): substitui mirror de boilerplates por composição atômica modular`.

### Encerramento de PR3 (Inteligência e Automação)

- [ ] **3.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `feat(spec-0021): Fase 3 — Inteligência e Automação (PR3)`.
- [ ] **3.[DESCRIPTION]** Descrever: (1) Extração automática de regras [BR-CLI-*]; (2) Engine de Recipes e Partials; (3) Remoção do mirror legado.
- [ ] **3.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de 3.B e pipeline verde.
- [ ] **3.[MANDATÓRIO]** Aguardar aprovação humana explícita.
- [ ] **3.[MERGE]** Após aprovação, fazer merge seguindo a chain em AGENTS.md.

---

## Fase 4 — Cleanup Final e Homologação (PR4)

> **PR4**: Branch `feat/spec-0021-fase-4`, commit final (4.A), merge após aprovação humana.

### Sub-bloco [4.A] — Cleanup e Smoke Tests

- [ ] **4.A.[NEW-BRANCH]** Branch `feat/spec-0021-fase-4` criada a partir de `main` (PR3 mergeada).
- [ ] **4.A.1** **[Smoke Tests]** Atualizar a suíte smoke para validar a nova topologia e o contrato `.governance/` em Windows, Linux e macOS.
- [ ] **4.A.2** **[Legacy Removal]** Remover definitivamente códigos de suporte a paths legados se o plano strangler fig permitir o corte agora.
- [ ] **4.A.3** **[Final Review]** Revisar README, CONTRIBUTING, AGENTS e help textual para garantir 100% de alinhamento.
- [ ] **4.A.N** Pipeline de homologação verde (check + test + smoke).
- [ ] **4.A.[COMMIT]** Commit sugerido: `chore(spec-0021): cleanup final, smoke tests multi-OS e alinhamento de docs`.

---

## Fase de Review e Encerramento Final

- [ ] **R.1-R.8** Gate de Homologação e Cleanup (ver template).
