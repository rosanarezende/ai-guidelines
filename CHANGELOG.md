# Changelog

Todas as mudanças notáveis neste framework seguem [Semantic Versioning](https://semver.org/lang/pt-BR/) e o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

### Alterado

- CLI passa a compilar o bloco `<AI_GUIDELINES>` diretamente no `AGENTS.md` como artefato monolítico topológico: diretivas e regras no topo, módulos opt-in envelopados em tags XML no centro, e contexto tático na base.
- `adopt` deixa de sincronizar `.ai-guidelines/rules/` no consumidor; regras individuais permanecem como fonte modular em `.core/rules/` no repositório do framework.
- Adicionados aliases nativos via `package.json#imports` (`#core/*`, `#features/*`, `#formatters/*`) para reduzir imports relativos profundos.
- Pesquisas da Spec 0017 centralizadas em `.specify/specs/researchs/`, com índice atualizado e bootstrap reforçado para leitura obrigatória do backlog.

---

## [1.2.0] — 2026-04-26

### Adicionado

- **Spec 0008 (Governance Coherence)**:
  - Fluxos de onboarding por persona no `README.md` e `CONTRIBUTING.md`.
  - [ADR 0007](file:///adrs/0007-visibilidade-publica-ai-guidelines.md) formalizando a estratégia de visibilidade pública.
  - Passo 0 de "Environment Check" no `AGENTS.md` para maior assertividade situacional.
  - Workflow colaborativo de 3 etapas para descrições de Pull Request em `global-rules.md`.
  - Features opt-in no CLI para `quality-gates` e `tdd`.
  - Templates SDD (`spec`, `plan`, `tasks`, `next`) padronizados em `.specify/templates/`.
- Issue Templates para bugs, features, fricção e perguntas em `.github/ISSUE_TEMPLATE/`.

### Alterado

- `AGENTS.md` reestruturado para maior clareza operacional e distinção entre plano leve vs spec-foundation.
- `global-rules.md` e `ai-efficiency-guide.md` consolidados para eliminar duplicações e atualizar referências de modelos (2026).
- CLI atualizado para suportar novas features opt-in e remoção de constantes obsoletas (`DEFAULT_AI_GUIDELINES_REF`).

### Removido

- **Spec 0015 (Auditoria Destrutiva)**:
  - Remoção de diretórios legados e inflados (`design/`, `.core/docs/mcp/`, `cinematic-ui-boilerplates/`, `advanced-ai-patterns/`) para sanitização pré-snapshot público.
  - Purga de referências e links internos para arquivos removidos.

### Contexto

Esta versão consolida a infraestrutura de governança e prepara o repositório para a visibilidade pública. A Spec 0008 harmonizou as regras editoriais com o motor técnico, enquanto a Spec 0015 garantiu um baseline limpo e focado no core do framework.

---

## [1.1.0] — 2026-04-17

### Adicionado

- Adapters por IA na raiz: `for-gemini/setup.md`, `for-claude/setup.md`, `for-codex/setup.md` — pontos de entrada específicos por agente sem poluir as regras globais.
- `projects.md.example` — formato esperado para arquivo local não versionado de contexto de projetos.
- `workflows/README.md` documentando a convenção **Preset + Placeholders** (inspirada em shadcn/ui + Plop/Hygen) e ciclos de vida dos workflows MVP.

### Alterado

- `workflows/pr-curator.md` reescrito como **schema-agnóstico** (IA lê `{{schema_ref}}` em runtime) com 7 placeholders e nota de ciclo de vida MVP → GitHub Action (Fase 2).
- `workflows/project-scaffolding.md` parametrizado com preset de stack (5 placeholders; defaults Next.js + React + TailwindCSS).
- `workflows/ai-review-ritual.md` com `{{ecosystem_name}}` e remoção de menções a "Antigravity".
- `rules/global-rules.md`, `AGENTS.md`, `docs/ai-efficiency-guide.md`, `docs/editorial-guidelines.md`, `docs/rpi-protocol.md`, `docs/advanced-ai-patterns.md`: generalização multi-IA, remoção de acoplamentos a projetos específicos e links absolutos Windows → relativos.
- `package.json` com descrição agnóstica.

### Removido

- Todas as menções hardcoded a informações pessoais e projetos específicos fora de contextos de exemplo/preset default.
- Seção "Contexto dos Projetos" de `global-rules.md` (migrada para arquivo local não versionado via `projects.md.example`).

### Contexto

Fecha a **Fase 1** da Spec 0001 (Desacoplamento e Agnosticidade). Três vagas acumuladas em PR único (#6): A — fundação documental; B — purga de acoplamentos + adapters por IA; C — parametrização estrutural dos workflows.

Agnosticidade multi-IA validada empiricamente em teste de fumaça 6/6 (Gemini 2.5 Pro + Claude Sonnet 4.6 × 3 repos). Próxima fase (2) trata de publicação como package NPM e automação cross-repo — ver `NEXT.md`.

---

## [1.0.0] — 2026-04-16

### Adicionado

- `README.md` posicionando ai-guidelines como framework de governança de IA agnóstico e portável.
- `CHANGELOG.md` com histórico de versões seguindo semver.
- `adrs/0001-polyrepo-federado.md` — decisão de adotar Polyrepo Federado como padrão arquitetural.
- `adrs/0002-mfe-adiado-para-fase-3.md` — decisão de adiar MFE com 4 gatilhos explícitos de reavaliação.
- `.specify/specs/0001-desacoplamento-e-agnosticidade/` — spec, plano, tasks e backlog (NEXT) da Fase 1.

### Contexto

Esta versão marca a primeira formalização do ai-guidelines como produto independente de qualquer projeto específico. Até esta data, o framework existia como infraestrutura implicitamente acoplada ao projeto pessoal da mantenedora. A partir de 1.0.0, inicia-se o processo de agnosticidade progressiva documentado na Spec 0001.
