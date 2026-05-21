# Changelog

Todas as mudanças notáveis neste framework seguem [Semantic Versioning](https://semver.org/lang/pt-BR/) e o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — `1.1.0-preview.0` (workflow runtime preview)

> ⚠️ **Preview, UX may evolve.** Esta versão introduz o **workflow runtime humano-IA** (Spec 0023) e o **lifecycle metodológico** com gates explícitos (ADR 0020). Tudo aqui é experimental — comportamentos podem mudar antes do 1.1.0 estável. Não usar como base de runtime de produção sem leitura completa de [`.governance/specs/0023-workflow-runtime/`](.governance/specs/0023-workflow-runtime/).

### Adicionado

- **Workflow runtime CLI** (`ai-guidelines workflow` + `ai-guidelines continue`). REPL contextual sobre a spec ativa: briefing operacional (stage, gate, hipóteses extraídas de `research.md`, próxima ação), menu de ações estruturadas, classificação de texto livre em **context bundle copy-paste-ready** para sessão IA externa. **Não embute LLM** — AI-as-Channel preservado (ADR 0018).
- **Índice operacional público mínimo** `.governance/runtime/active-specs.yml` (PR3-runtime-state-index, Bloco G do decision-brief). Lista as specs ativas com schema fechado: `id`, `slug`, `branch`, `stage`, `status`, `spec_path`, `updated_at` (obrigatórios); `title`, `base_branch`, `source_state_path`, `updated_by`, `last_sync_commit` (opcionais). Campos normativos (`next[]`, `[DEC-*]`, rationale, checklist, debts, texto longo) são **proibidos** — rejeitados pelo parser com mensagem citando `[DEC-0023-G01]`. `stage` é projeção direta de `state.yml.stage` (mesmo enum); `status ∈ {active, blocked, paused, completed}` é dimensão independente declarada manualmente.
- **`ai-guidelines workflow`** agora lista specs ativas do índice público no boot (lookup-only, sem ordenação/freshness/prioridade) e marca a spec corrente com `*` (match tri-form `id | slug | id-slug`). Quando branch não casa nenhuma spec, o índice é exibido como hint cross-spec.
- **`ai-guidelines continue [<slug|id>]`**. Sem argumento, mantém comportamento legado (detecção via branch). Com argumento, resolve a spec via índice público (match exato em `id | slug | id-slug`); orienta `git checkout` por texto quando o `spec_path` não está disponível localmente — **sem auto-checkout**.
- **`ai-guidelines workflow publish-state --status=<active|blocked|paused|completed> --updated-by=<autorizador>`** (manual-first, sem hooks/CI). Projeta o `state.yml` interno da spec corrente como entry no índice público (`stage` direto; `status`/`updated_by` declarados; `updated_at` gerado pelo sistema; idempotente — upsert por `id`). Validação round-trip antes de gravar (fail-fast contra inconsistência interna). **Sem inferência** de `updated_by` via git config, de `last_sync_commit` via HEAD, ou de `status` via state.yml — declaração explícita em todos os campos semânticos.
- **Drift narrado soft** quando `spec_path` declarado no índice diverge do filesystem (branch não checked-out, ou path renomeado). Warning explícito; sem falha fatal, sem auto-correção.
- **`state.yml` mínimo** 4-chave (`stage`, `gate.status`, `focus`, `next`) como artifact canônico por spec. Schema fechado — chaves extras são rejeitadas em parse.
- **Double-lookup** `.governance/specs/` → `.specify/specs/` no runtime de detecção de spec ativa. Bridge transparente, sem deprecation timeline.
- **ADR 0019** — `.governance/specs/` como root primária no repositório mantenedor.
- **ADR 0020** — Governance precede e protege execução. Operacionaliza governance-first em lifecycle de PRs: 4 fases (discovery → decision → planning → execution), `tasks.md` como boundary canônico de autorização de execução, stacked PRs (PR-thinking + PR-execution), CI mínimo de integridade estrutural.
- **`governance-pr-check`** (`src/cli/governance-pr-check.ts` + `.github/workflows/governance-pr-check.yml`): CI mínimo que valida apenas (1) execution PR declara dependência via marcador "Depends on #N (governance)"; (2) governance PR existe; (3) governance PR aberto/mergeado; (4) governance PR contém `tasks.md` no diff. Fast-track via label `fast-track` bypassa (cf. `[DEC-0023-D05]`).
- **Spec 0023** materializada em `.governance/specs/0023-workflow-runtime/` (pivot da 0023 original; trilha histórica preservada em `.specify/specs/0023-governance-workflow-discovery-model/`).

### Limitações conhecidas (preview)

- **`updated_at` no índice é registro factual, NÃO sinal operacional.** Não representa progresso, prioridade, atividade recente, freshness ou saúde — sorting/stale/heartbeat são deliberadamente fora de escopo (cf. jsdoc de `ActiveSpecEntry`). Qualquer enriquecimento semântico futuro exige DEC própria.
- **Sync do índice é manual.** `publish-state` é a única forma de atualizar `.governance/runtime/active-specs.yml`; sem hooks pre-commit, sem CI auto-sync, sem PRs incrementais de state. Reabrir após primeiro dogfood real (cf. `[DEC-0023-G03]`).
- **`HEAD` precisa de commit válido.** `git init -b <branch>` sozinho deixa HEAD unborn; `currentBranch()` retorna `null` até o primeiro commit. Sem fallback heurístico — humano vê erro orientativo.
- **Bootstrap de spec ausente.** Não há comando para criar `state.yml` automaticamente em spec existente nem para criar spec nova com a estrutura mínima. Bootstrap entra em release futura (critério de exit do preview).
- **Convenção de branch obrigatória.** Detecção de spec ativa exige branch nomeada `feat|fix|docs|chore|refactor/spec-NNNN-{slug}`. Branches fora dessa convenção devolvem "spec não detectada". Sem fallback heurístico.
- **Extraction de `research.md` é frágil.** `AssembleBriefing` casa cabeçalhos específicos do template canônico (`### H1 —`, `### 8.1 ...`). Specs fora dessa convenção recebem briefing thin com warning explícito.
- **Drift detection deliberadamente diferido.** `governance-pr-check` valida apenas linkagem estrutural — não detecta divergência semântica entre `tasks.md` declarado e arquivos modificados. Reabrir como spec própria quando padrões de divergência se acumularem.
- **Stacked PR rebase pain.** Sem ferramenta tipo Graphite/spr, rebase em cadeia é manual. Atrito honesto a ser experimentado.
- **Clipboard ainda em no-op por default** (substituído por `NodeClipboard` real em PR5-DX-execution stacked).
- **AI-as-Channel é restrição cravada.** Runtime nunca chama LLM; texto livre vira context bundle. Comportamentos derivados (interpretação de intent, response inteligente) ficam com agente IA externo (Claude Code / Cursor / etc.).

### Notas metodológicas

- **PR1 da Spec 0023 declaradamente pre-model** (`[DEC-0023-D04]`): atravessou discovery + decision + execution num único PR antes do lifecycle estar cravado. Não é git surgery retroativa — é honestidade histórica.
- **PR2-lifecycle declaradamente bootstrap**: introduz o modelo, não pode aplicar a si mesmo. Modelo aplica estritamente a partir de PR3-enforcement-runtime + PR4-DX-thinking + PR5-DX-execution.
- **Memory entry**: feedback persistente sobre "decisões estruturais emergindo implícita durante implementação" capturado para sessões futuras de agentes IA — vide `decision-brief.md` Bloco B → B05 corretivo.

---

## [1.0.1] — 2026-05-08

Hotfix do primeiro release público + reescrita da landing pública (`README.md`).

### Corrigido

- **Bug crítico no entrypoint do `bin`** (afetava 100% dos consumidores via `npx`/`npm exec` em qualquer SO): o arquivo apontado por `package.json::bin` (`cli/ai-guidelines-cli.mjs`) não tinha shebang `#!/usr/bin/env node`. Sem shebang, o shim que o npm gera em Windows tentava executar o `.mjs` diretamente, e o sistema usava associação de extensão (editor de texto) — resultando em saída silenciosa com exit 0 sem rodar a CLI. Em Unix o cenário era análogo. Corrigido com a adição da linha `#!/usr/bin/env node` no topo do arquivo, conforme [npm docs `package.json#bin`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin). _(O smoke existente passou pré-publish porque invocava o entrypoint via `node <path>` direto, simulando o resultado que o shim deveria entregar — não testava o shim em si.)_

### Adicionado

- **Smoke test de regressão `tests/smoke/bin-shim.test.mjs`** cobrindo dois invariantes que teriam pego o bug acima e ficam como rede de segurança para futuras releases:
  1. **Estático** — primeira linha do arquivo apontado por `package.json::bin` precisa começar com shebang e referenciar `node`.
  2. **Comportamental** — invocar o bin via shim do npm (`node_modules/.bin/<name>` cross-platform) precisa executar a CLI e criar os artefatos esperados no target. Cobre o caminho real do consumidor pós-publish (`npx ai-guidelines …`), não apenas o entrypoint isolado.

### Alterado

- **`README.md` reescrito como landing pública consumer-facing** (-65% de extensão, de 271 para 95 linhas). Foco em valor concreto para o consumidor que chega via npmjs.com: tagline forte, quick start no topo, bullets de ganho real, comandos essenciais em tabela, compatibilidade Multi-IA, "como funciona em um minuto". Hero image (`docs/assets/ai-guidelines-flow.png`) ilustra o ciclo completo de governança (Backlog → Spec → Plano → Execução → PR → Merge → Valor entregue) com extensões emergentes (Lifecycle de release, Arquitetura da informação).
- **`CONTRIBUTING.md` ampliado** absorveu material que vivia no README e era irrelevante para consumidor externo: setup local de desenvolvimento (Node ≥ 22, Yarn 4 PnP, `yarn guidelines …`), estrutura completa do repositório, convenções internas. Cross-ref explícita para a sequência canônica de release em `.core/process/spec-foundation.md`.
- **`docs/cli/ai-guidelines-cli.md`** ganhou seção 0 — "Política de Update — `managed-block` + `mirror`" — que vivia no README e era referência técnica detalhada inadequada para landing.

### Lição operacional cravada

- **Smoke deve cobrir o caminho real do consumidor, não apenas o entrypoint isolado.** Invocar `node <bin-path>` simula o **resultado** que o shim deveria entregar com sucesso; não simula o **shim em si**. Para CLIs publicadas via `bin`, smoke obrigatório precisa rodar via `node_modules/.bin/<name>` (cross-platform). Regra incorporada como sub-bloco H da Spec 0020 e refletida no smoke `bin-shim.test.mjs`.

---

## [1.0.0] — 2026-05-08

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
