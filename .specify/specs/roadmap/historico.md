# Histórico — ai-guidelines

Este arquivo registra specs concluídas e absorvidas. É leitura de contexto
histórico, não roadmap de execução — o presente e futuro vivem em
[`backlog.md`](./backlog.md).

Entradas são snapshots do estado no momento do fechamento da spec. Não
editar retroativamente.

---

## Specs concluídas

Em ordem cronológica reversa. Número mantido como rastreabilidade.

- **spec 0019** — Bootstrap Consumidor e Runtime
  (`.specify/specs/0019-bootstrap-consumidor-e-runtime/`) — **Done** (2026-05-07, PR #5).

  Fecha a cadeia de bootstrap do consumidor e do runtime compilado. Spec do tipo `mixed` que **foi reaberta consensualmente** (2026-05-07) durante o gate de review humano para absorver o spinoff `template-lifecycle-e-update`, eliminando débito imediato após uma revisão técnica que identificou regressões silenciosas.

  **Sub-bloco A — CLI Wizard & Template Distribution (`deterministic`):**
  - Wizard refatorado com `@inquirer/prompts` (checkbox/select/confirm) e categorias (Editorial / Infra).
  - Distribuição de `.specify/templates/` para `.ai-guidelines/templates/` no `init`/`adopt`.
  - `.ai-guidelines/config.json` persiste apenas o contrato do usuário (`sdd_dir`, `providers`, `features`, `lang`); adapters são derivados em runtime.
  - Comando `providers` com merge aditivo + `--prune` autoritativo apenas para providers selecionados.
  - Execução local via `yarn cli` (renomeado posteriormente para `yarn guidelines`) compatível com Yarn PnP.
  - Override granular de incompatibilidades (formatter rival) sem `--force` global.
  - Template legado `AGENTS-pointer` removido; `CLAUDE.md` raiz reduzido a ponteiro mínimo, conteúdo migrado para `AGENTS.md`/`README.md`/`CONTRIBUTING.md`.

  **Sub-bloco B — Runtime Architecture & Trampolines (`evidence-driven`, `[DEC-0019-B01]` / `[DEC-0019-B02]`):**
  - Compilador agrupando AGENTS.md em zonas temáticas (Top Zone: Primary Directives, Lifecycle & Spec System, Git & PR Workflow, Engineering Principles, Center Zone: Opt-in Methodologies, Base Zone: Tactical Context).
  - Interpolação de `sdd_dir` para evitar paths hardcoded ao repositório mantenedor.
  - Provider entrypoints (CLAUDE.md, GEMINI.md, .openai/instructions.md, .cursor/rules/ai-guidelines.mdc, etc.) gerados apenas para os providers selecionados.

  **Sub-bloco C — Update Lifecycle Unificado (`deterministic`, adicionado 2026-05-07, `[DEC-0019-C01]` / `[DEC-0019-C02]`):**
  - Política unificada de update com dois modos: `managed-block` (marcadores `<!-- ai-guidelines:managed-start v=1 --> ... <!-- ai-guidelines:managed-end -->` para trampolins/ignores) + `mirror` (overwrite total para templates SDD).
  - Adapter content **migrado do `AGENTS.md` para o trampolino do provider correspondente**, eliminando o wrapper H3 `### Provider Adapters` órfão.
  - Comando `update` headless e idempotente que lê `.ai-guidelines/config.json` existente e re-aplica trampolins + templates + recompilação.
  - Versionamento leve `<!-- ai-guidelines-template: <slug> v=N -->` em cada boilerplate SDD; CLI loga transições no formato `(template v=1 -> v=2)`.
  - Renomes operacionais: "trampolino" → `provider-entrypoint` no código; `yarn cli` → `yarn guidelines` como comando canônico.
  - Comando `check-budget` com novos limits derivados do dogfooding e da research `tokens-baseline-budget`: `agentsMd: 2700`, `perAdapter: 800`, soft ceiling 75%.
  - Validação de `sdd_dir` contra path traversal antes de qualquer I/O.

  **Researches migrados para `.specify/specs/researchs/architecture/`:** `2026-05-06-trampolins-e-guardrails.md`, `2026-05-06-topologia-runtime.md`.

  **Qualidade:** `yarn check` e `yarn test` verdes no fechamento; 263/263 testes passando, orçamento de tokens dentro dos limites em todos os escopos (universal 74%, opt-in 33%, AGENTS.md 56%, entrypoints ~28-30%).

- **spec 0018** — Rules Content Deepening
  (`.specify/specs/0018-rules-content-deepening/`) — **Done** (2026-05-06, PR #4).

  Fecha a reconstrução research-backed do conteúdo de regras do framework e dogfooda a própria política de specs `evidence-driven`.

  **Sub-bloco A — Política framework + boilerplates:**
  - Formalização do campo `Tipo de spec` (`evidence-driven`, `deterministic`, `mixed`) e do gate humano via `decision-brief.md`.
  - Revisão dos boilerplates SDD e criação do `decision-brief-boilerplate.md`.
  - Sincronização de `.core/process/spec-foundation.md` com o workflow em dois passes e com a política de lifecycle de `NEXT.md`.

  **Sub-bloco B — Rules content overhaul:**
  - Purga radical do legado `b9efb83`, mantendo apenas o que sobreviveu à reconciliação source-backed.
  - Pipeline Docs-as-Code para regras (`rules-parser`, `rules-builder`, `rules.json`, compiler/pointers).
  - Catálogo bilíngue com `Instruction (en)` para runtime e documentação PT-BR para humanos.
  - Token budget com Tok-H, IDs canônicos `[GR-*]` / `[ADP-*]` / `[OPT-*]` e hierarquia mínima de `opt-in/` em `methodologies/` e `quality/`.
  - Eval amostral baseline em Claude, Codex e Gemini, com research centralizada em `.specify/specs/researchs/`.

  **Qualidade:** `yarn format`, `yarn check` e `yarn test` verdes no fechamento; 213/213 testes passando e warning de budget universal mantido abaixo do teto.

- **spec 0017** — Process Refinement & CLI Refactor
  (`.specify/specs/0017-process-cli-refactor/`) — **Done** (2026-04-29, PR #3).

  Refatoração fundamental para mitigar a degradação de compliance ("Fixed-tier Bottleneck") através de uma nova arquitetura de injeção de contexto.

  **Sub-bloco A — Process & Sanitization:**
  - Auditoria e limpeza da pasta `docs/`; regras técnicas migradas para `.core/rules/`.
  - Política de lifecycle de pesquisas formalizada e indexada.
  - Bootstrap do agente reforçado com leitura obrigatória do `backlog.md`.

  **Sub-bloco B — CLI Architecture & Monolithic Compiler:**
  - Implementação do **Monolithic Runtime Compiler**: unifica o `AGENTS.md` em um artefato topológico (Sanduíche de Contexto: Topo/Centro/Base) usando tags XML relacionais.
  - Path Aliases via `package.json#imports` (`#core/*`, `#features/*`, `#formatters/*`) para eliminar imports relativos frágeis.
  - Isolamento do motor de I/O em `cli/core/io.mjs`.

  **Qualidade:** Golden Green mantido com 94% de cobertura.

- **spec 0008** — Governance Coherence
  (`.specify/specs/0008-governance-coherence/`) — **Done** (2026-04-28, PR #1).

  Spec de maior escopo do repositório: fundiu 3 candidatas originais (0005-B, 0008, 0010) em 7
  sub-blocos que consolidão o baseline de governança de IA de forma coerente e auditada.

  **Sub-bloco A — Filtro doc → rules:**
  Classificação tripla de todos os arquivos de `.core/docs/` em `humano`, `universal` e
  `opt-in`. Nova seção "Workflow com IA" em `global-rules.md` com regras mandatorias vindas
  de pesquisa de 6 transcrições. Resolução dos 3 bloqueadores do PR #19 (dead code
  `DEFAULT_AI_GUIDELINES_REF`, link quebrado no template, refs `docs/ai-efficiency` nas
  rules). Teste `[BR-GOV-COH-01]` adicionado para detectar links quebrados em runtime.

  **Sub-bloco B — Canonização RPI ↔ spec-foundation:**
  Critério objetivo de "quando usar spec-foundation vs plano leve" documentado em
  `AGENTS.md` (regras 10-11) e espelhado no template. Reformulação completa de
  `docs/process/spec-foundation.md` (33 → 178 linhas) com checklists de abertura/fechamento
  de spec, política de `NEXT.md` temporário-mandátorio, regra de numeração por slug
  sem renumeração, e a nova categoria "universal vs opt-in de stack". 6 boilerplates SDD
  criados/refatorados em `.specify/templates/`: `spec`, `plan`, `tasks`, `next`,
  `roadmap` e `research-index`. ROADMAP migrado para pasta `roadmap/` com dois arquivos
  (`backlog.md` + `historico.md`), política repo-first e candidatas por slug.

  **Sub-bloco C — Consolidação AI Efficiency Guide:**
  Eliminação da duplicação interna em `global-rules.md` ("Economia de Tokens" + "Eficiência
  de IA"). Reescrita de `docs/ai-efficiency-guide.md` com matriz de modelos 2026, seções
  de model routing escéptico, prompt caching (Anthropic API), EN vs PT em prompts, e
  custo/quota awareness com handoff explícito para Spec 0014.

  **Sub-bloco D — Environment Awareness (Phase 0):**
  Novo item "Environment Check" inserido no `AGENTS.md` e template core, com matriz
  Plataforma/Shell/Surface/Modelo. Smoke tests manuais documentados em
  `research/step-zero-smoke-test.md`.

  **Sub-bloco E — Quality Gates + TDD + BDD como features opt-in:**
  Nova feature `quality-gates` no CLI (checklist com 4 grupos: análise estática, cobertura
  - mutation, bugs típicos de IA, secret scanning). Separação arquitetural de `tdd` e `bdd`
    em features independentes com suporte a i18n (`pt`/`en`) via flag `--lang`. Subpastas
    `cli/features/opt-in/editorial/` e `cli/features/opt-in/infrastructure/` criadas
    (Taxonomia Editorial vs Infraestrutura — Fase 2.8). `OPT_IN_RULE_FILES` derivado
    programaticamente de `FEATURE_OPTIONS`. Factory `createOptInRuleTestSuite()` elimina
    boilerplate duplicado nos 3 testes opt-in. `.core/rules/opt-in/` criado para isolar
    regras que `applyRules` não deve copiar automaticamente.

  **Sub-bloco F — Onboarding e Contribuição:**
  `README.md` reescrito com 3 caminhos por persona (ususar, contribuir, agente IA).
  `CONTRIBUTING.md` refatorado com 4 workflows concretos (ajuste rápido, feature/refactor,
  spec consolidada, agente autônomo). 4 issue templates criados em `.github/ISSUE_TEMPLATE/`
  (`bug-report`, `feature-proposal`, `friction-report`, `question`). Tom orientado a
  comunidade BR, coerente com a decisão de visibilidade pública da ADR 0007.

  **Sub-bloco G — Decisão de Visibilidade Pública:**
  4 auditorias de pré-condição (naming npm, menções pessoais, citações de terceiros,
  exposição em git history). Sweep de curadoria aplicado (voz neutra, atribuição correta).
  ADR 0007 formaliza opção "fresh repo + snapshot curado": repo atual arquivado como
  `ai-guidelines-archive` (privado); novo repo público nasce com snapshot pós-curadoria.

  **Qualidade:** 107/107 testes verdes; cobertura 93%+. `G.6` (checklist `.gitignore`) pendente
  como oportunista (removido do escopo por não bloquear o merge).

- **spec 0015** — Auditoria Destrutiva
  (`.specify/specs/0015-auditoria-destrutiva/`) — **Done** (2026-04-28, PR #22).

  Limpeza destrutiva do baseline para viabilizar a decisão de visibilidade pública (ADR 0007).
  Executada na janela entre os sub-blocos A+B e F+G da Spec 0008.
  - Deleção de 6 artefatos obsoletos herdados de projetos externos: `cinematic-ui-boilerplates.md`,
    pasta `mcp/` (com `registry.md`), pasta `skills/` (com `README.md`),
    `process/ai-review-ritual.md`, `process/project-init.md` e `design/`.
  - Arquivo `projects.md.example` migrado para `.specify/templates/project-config-boilerplate.md`
    (reutilizável como boilerplate de config de projetos por agentes).
  - `advanced-ai-patterns.md` processado: insights relevantes absorvidos; arquivo deletado.
  - Reparo de todas as referências cruzadas quebradas no `README.md` e demais docs.
  - `yarn check && yarn test` verde após cada remoção.

- **spec 0005** — CLI Adopt Refactor & Maturity (Pointer Architecture)
  (`.specify/specs/0005-cli-adopt-refactor/`) — **Done** (2026-04-22).
  - Transição para **Arquitetura de Ponteiros** no `AGENTS.md`.
  - Detecção situacional de Package Manager e Monorepos.
  - Sincronização inteligente com `Prune` de arquivos órfãos.
  - Gestão de permissões POSIX para Hooks.
  - Consolidação de core mandatório (`pointers`, `rules`,
    `.gitattributes`) e opt-ins (`prettier`, `husky`, `ci`).

- **spec 0004** — AI dev foundations + public-ready
  (`.specify/specs/0004-ai-dev-foundations-public-ready/`) — **Done** (2026-04-22).
  - Reestruturação arquitetural (`cli/`, `docs/`, `rules/`).
  - Testing foundation com 95% de cobertura BDD em scripts.
  - Public-ready assets: `LICENSE` (Apache-2.0), `CONTRIBUTING.md`,
    `CODE_OF_CONDUCT.md`, `SECURITY.md`, PR Templates.
  - Governança SDD Compliance (Vaga E) validada.

- **spec 0003** — Adopt context-aware + core spec-first
  (`.specify/specs/0003-adopt-context-aware/`) — **Done** (PR #15 mergeado).

- **spec 0002** — Project init automation
  (`.specify/specs/0002-project-init-automation/`) — **Done**.

- **spec 0001** — Desacoplamento e agnosticidade
  (`.specify/specs/0001-desacoplamento-e-agnosticidade/`) — **Done**.

---

## Specs Pivotadas / Pausadas

Specs que iniciaram o RPI, mas tiveram seu escopo alterado drasticamente, provaram-se inviáveis no design inicial ou foram convertidas em Issues/novas candidatas antes do deploy.

- **spec 0016** — Adapters Opt-in para Trackers
  (`.specify/specs/0016-adapters-opt-in/`) — **Pivoted** (2026-04-27).
  - O design inicial propunha injetar apenas arquivos `.md` (regras em texto) para que os agentes operassem Trackers.
  - O laboratório (TDD) provou que se tratava de uma "ilusão de automação". A automação real de quadros (especialmente GitHub Projects V2) exige determinismo, scripts e chamadas de API (GraphQL).
  - O código do CLI foi revertido e os aprendizados geraram novas candidatas no backlog (`tracker-automation`, `process-refinement`, DRY testing).

---

## Specs absorvidas

Specs propostas que foram fundidas em outra spec. Rastreabilidade via
ponteiro para a spec absorvedora.

- **spec 0005-B** (contingência) — Auditoria de Governança → absorvida em
  **spec 0008** (Governance Coherence), sub-bloco A. Critério de fusão:
  modifica os mesmos arquivos canônicos (`.core/rules/global-rules.md`)
  que outros sub-blocos de 0008; é pré-requisito conceitual dos demais.

  Objetivo original: filtragem de Documentação Humana para Regras
  Acionáveis, evitando a poluição da pasta `docs/` nos repositórios alvo.
  Detalhes em `.specify/specs/0008-governance-coherence/spec.md`.

- **spec 0008** (candidatura original "RPI ↔ spec-foundation") → absorvida
  em **spec 0008** (Governance Coherence), sub-bloco B. O número 0008 foi
  preservado; o escopo expandiu-se para fundir também 0005-B e 0010 sob a
  mesma raiz (coerência interna do baseline).

- **spec 0010** — Consolidação de Eficiência de IA → absorvida em
  **spec 0008** (Governance Coherence), sub-bloco C. Critério de fusão:
  modifica os mesmos dois arquivos canônicos (`AGENTS.md` +
  `.core/rules/global-rules.md`) que outros sub-blocos de 0008.

  Motivação original: o `docs/ai-efficiency-guide.md` nasceu como "economia
  de tokens" e evoluiu para cobrir eficiência de IA de forma ampla (context
  engineering, model routing, custo). Referências dispersas no ecossistema
  geravam inconsistência; 0008-C unifica.
