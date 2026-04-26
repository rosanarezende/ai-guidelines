# Histórico — ai-guidelines

Este arquivo registra specs concluídas e absorvidas. É leitura de contexto
histórico, não roadmap de execução — o presente e futuro vivem em
[`backlog.md`](./backlog.md).

Entradas são snapshots do estado no momento do fechamento da spec. Não
editar retroativamente.

---

## Specs concluídas

Em ordem cronológica reversa. Número mantido como rastreabilidade.

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
