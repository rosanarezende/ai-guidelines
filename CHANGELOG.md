# Changelog

Todas as mudanças notáveis neste framework seguem [Semantic Versioning](https://semver.org/lang/pt-BR/) e o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

_(Sem mudanças não-publicadas no momento.)_

---

## [1.0.0] — 2026-05-07

Primeiro release público no registry npm. Spec 0020 (`npm-publication`) — destrava distribuição via `npx ai-guidelines init` para consumidores externos. Versionamento foi resetado de `1.4.0` interno para `1.0.0` deliberadamente: nenhuma das versões anteriores (`0.x` / `1.x`) chegou a ser publicada (`package.json` carregava `"private": true`); `1.0.0` inicia a série pública e ancora SemVer a partir do contrato real instalável.

### Adicionado

- **Metadados de publish em `package.json`:** campos `license` (`Apache-2.0`, conforme ADR 0006), `repository`, `homepage`, `bugs`, `keywords` e `engines.node` (`>=22.0.0` — piso técnico real exigido pelos scripts de teste do CLI).
- **Pacote publicável no registry npm público** sob o nome não-scoped `ai-guidelines` (decisão de naming + estratégia de registry + auth do `pr-curator` registradas em [ADR 0009](adrs/0009-package-naming-and-registry.md) — entrega da própria Spec 0020).

### Alterado

- **Flag `"private": true` removida** de `package.json` — habilita `npm publish`.

### Notas de migração

- **Para consumidores:** usar `npx ai-guidelines init` em vez de clonar o repositório (orientação interna `yarn guidelines …` permanece como fluxo de contribuidor).
- **Para o ecossistema:** a org `@ai-guidelines` (npmjs.com) fica **reservada** para extensões futuras (`@ai-guidelines/<addon>`); package principal continuará não-scoped.

---

## [1.4.0] — 2026-05-07

Release agrupada cobrindo as Specs 0018 (catálogo Docs-as-Code de regras) e 0019 (bootstrap do consumidor + runtime). PRs auto-suficientes: ambos os PRs deixam o repositório em estado liberável no merge.

### Adicionado

- **Spec 0019 (Bootstrap Consumidor e Runtime)** — PR #5, consenso 2026-05-07:
  - **Política unificada de update** dos artefatos distribuídos ao consumidor:
    - `managed-block` para trampolins (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, `.cursor/rules/ai-guidelines.mdc`, `.github/copilot-instructions.md`, `.windsurfrules`, `CONVENTIONS.md`) e ignore files (`.claudeignore`, `.aiexclude`, `.gptignore`, `.aiderignore`). Marcadores `<!-- ai-guidelines:managed-start v=1 --> ... <!-- ai-guidelines:managed-end -->` (e variante `# ...` para gitignore-style) delimitam a região controlada pela CLI; conteúdo do consumidor fora dos marcadores é preservado, com comentário PT-BR sinalizando legado em arquivos preexistentes.
    - `mirror` para `.ai-guidelines/templates/`: overwrite total seguro porque boilerplates SDD não são editados in-place. Cada template carrega header de versão `<!-- ai-guidelines-template: <slug> v=N -->`; a CLI loga transições no formato `(template v=1 -> v=2)`.
  - Comandos novos `yarn guidelines update` (re-aplica trampolins + templates + recompilação de forma headless e idempotente) e `yarn guidelines check-budget` (relatório de orçamento de tokens por scope, AGENTS.md compilado e cada provider entrypoint).
  - Wizard interativo refatorado com `@inquirer/prompts` (checkbox/select/confirm) e categorias (Editorial / Infra).
  - Distribuição da pasta `.specify/templates/` para `.ai-guidelines/templates/` no `init`/`adopt`.
  - `.ai-guidelines/config.json` persiste apenas o contrato do usuário (`sdd_dir`, `providers`, `features`, `lang`); adapters são derivados em runtime.
  - Comando `providers` com merge aditivo + `--prune` autoritativo apenas para providers (nunca apaga `.ai-guidelines/templates/`).
  - Override granular de incompatibilidades (formatter rival) sem `--force` global.
  - Validação de `sdd_dir` contra path traversal antes de qualquer I/O.

### Alterado

- **Comando canônico da CLI:** `yarn cli` → `yarn guidelines` (troca direta sem alias deprecado, repositório ainda em pré-1.0).
- **Topologia do `AGENTS.md` compilado:** organizado em zonas temáticas (`Top Zone: Primary Directives`, `Lifecycle & Spec System`, `Git & PR Workflow`, `Engineering Principles`, `Center Zone: Opt-in Methodologies`, `Base Zone: Tactical Context`); paths interpolam `sdd_dir` em vez de hardcode.
- **Adapter content migrado para os trampolins:** regras específicas de cada adapter (`.core/rules/{claude,codex,gemini}.md`) deixam de ser injetadas no `AGENTS.md` e passam a viver dentro do `managed-block` do trampolino correspondente. O `AGENTS.md` perde a seção `### Provider Adapters`.
- **Token budget refinado:** novos limits derivados da research e do dogfooding pós-Spec 0019: `agentsMd: 2700` (universal + opt-in), `perAdapter: 800` (hard-redirect + adapter rules de um provider), soft ceiling subiu de 70% para 75%. O escopo `aggregate: 6000` foi substituído por métricas mais úteis por arquivo emitido.
- **Renome interno:** "trampolino" → `provider-entrypoint` no código (`cli/features/core/provider-entrypoints.mjs`), refletindo a nomenclatura já usada na matriz de compatibilidade.
- **`CLAUDE.md` raiz** do framework reduzido a ponteiro mínimo; conteúdo migrado para `AGENTS.md`/`README.md`/`CONTRIBUTING.md`.

### Removido

- Template legado `.core/templates/AGENTS-pointer.md.tmpl` e referências relacionadas no compilador.

- **Spec 0018 (Rules Content Deepening)**:
  - `decision-brief-boilerplate.md` como 8º artefato canônico do SDD.
  - Catálogo de regras bilíngue Docs-as-Code com `rules.json`, IDs `[CORE-*]`, `[GR-*]`, `[ADP-*]`, `[OPT-*]` e índice navegável em `.core/rules/catalog.md`.
  - Budget heurístico Tok-H com soft ceiling agregado de 6K tokens e alertas por escopo.
  - Baseline de eval amostral para Claude, Codex e Gemini, com corpus congelado em `.specify/specs/researchs/`.

### Alterado

- `spec-foundation.md` passa a formalizar specs `evidence-driven` / `deterministic` / `mixed`, o gate humano por `decision-brief.md` e a distinção entre débitos da spec atual (`tasks.md`) e débitos futuros (`NEXT.md`).
- `AGENTS.md` e o runtime compilado passam a consumir apenas `Instruction (en)` do catálogo e corrigem o bootstrap de `CORE-02` para `.specify/specs/roadmap/backlog.md`.
- Regras opt-in ganham hierarquia mínima por tema em `.core/rules/opt-in/methodologies/` e `.core/rules/opt-in/quality/`.

### Removido

- Conteúdo legado sem evidência canônica do pacote inicial `b9efb83`, conforme a reconciliação radical da Spec 0018.

---

## [1.3.0] — 2026-04-30

### Alterado

- CLI passa a compilar o bloco `<AI_GUIDELINES>` diretamente no `AGENTS.md` como artefato monolítico topológico: diretivas e regras no topo, módulos opt-in envelopados em tags XML no centro, e contexto tático na base.
- `adopt` deixa de sincronizar `.ai-guidelines/rules/` no consumidor; regras individuais permanecem como fonte modular em `.core/rules/` no repositório do framework.
- Refinamento da hierarquia semântica no `AGENTS.md`: Zonas em `##`, seções em `###` e subseções em `####`.
- Remoção de redundância de títulos nos adaptadores de provedores (`Regras do Provedor:`).
- Adicionados aliases nativos via `package.json#imports` para reduzir imports relativos profundos.
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
