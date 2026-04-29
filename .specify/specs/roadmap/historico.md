# Histórico — ai-guidelines

Este arquivo registra specs concluídas e absorvidas. É leitura de contexto
histórico, não roadmap de execução — o presente e futuro vivem em
[`backlog.md`](./backlog.md).

Entradas são snapshots do estado no momento do fechamento da spec. Não
editar retroativamente.

---

## Specs concluídas

Em ordem cronológica reversa. Número mantido como rastreabilidade.

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
