# AGENTS.md

> **[MANDATÓRIO — HARNESS LOCK]** É proibido rodar `git commit` isoladamente. Toda submissão deve obrigatoriamente usar a cadeia: `yarn format ; yarn check ; git add . ; git commit -m "..."`.

Este arquivo define o fluxo obrigatório para qualquer IA atuando neste repositório.

> **Atuando para um humano contribuidor?** Leia também
> [`CONTRIBUTING.md`](CONTRIBUTING.md) para os 4 workflows por persona (ajuste rápido, feature/refactor, spec consolidada, agente IA com autonomia). Este `AGENTS.md` cobre a parte operacional do agente; `CONTRIBUTING.md` cobre o fluxo humano que o agente está apoiando.

## Contexto Local

Este repositório é o próprio framework `ai-guidelines`, não um consumidor do framework. Aqui vivem o baseline canônico em `.core/` e a CLI em `cli/` que serão distribuídos para outros repositórios via `init`, `adopt` e `providers`.

O `AGENTS.md` raiz tem papel duplo:

- documentação operacional local para humanos e agentes que contribuem neste repositório;
- artefato runtime de exemplo, com o bloco `<AI_GUIDELINES>` compilado pelo próprio framework.

Conteúdo específico deste repositório deve ficar fora de `<AI_GUIDELINES>`. O bloco compilado não é editado manualmente.

## Quickstart Local

Este workspace usa Yarn 4 com Plug'n'Play. Para execução local da CLI, o caminho suportado é `yarn cli ...`.

```bash
yarn install --immutable
yarn build:rules
yarn format
yarn check
yarn test
yarn check:repo
yarn cli adopt --target . --dry-run
```

<AI_GUIDELINES>

## Top Zone: Primary Directives

### [CORE-01]

Before the first technical action, identify platform, shell, surface (CLI vs IDE), and model class; adapt commands accordingly.

### [CORE-03]

Consult the "Global Rules" section injected later in this `<AI_GUIDELINES>` block for engineering principles and AI efficiency.

### [GR-0201]

Always respond using the repository default language.

### Provider Adapters

### Adapter: claude

### [ADP-0101]

Use Haiku or Sonnet for scoped, atomic coding tasks. Reserve Opus or Sonnet for architectural planning, multi-file analysis, and complex design decisions.

### [ADP-0102]

Use `.claudeignore` to control context payload. Ensure `AGENTS.md` and the `<AI_GUIDELINES>` block are properly loaded.

### [ADP-0103]

Be concise to counter Claude's default verbosity. In long sessions, use `/clear` or restart if context drift occurs. Respect `CLAUDE.md` for project-specific instructions.

### Adapter: codex

### [ADP-0201]

Leverage `.github/copilot-instructions.md` for project instructions in Copilot Chat. Use structured comments and JSDoc to guide inline code completion.

### [ADP-0202]

Use `#file` references to refine context in Copilot Chat. Ensure Codex CLI loads `AGENTS.md` properly.

### [ADP-0203]

Keep files focused and imports explicit to improve inline suggestions. Strictly follow governance rules (e.g., no autonomous push) when operating autonomously.

### Adapter: gemini

### [ADP-0301]

Load project-specific instructions from `GEMINI.md` and ensure `<AI_GUIDELINES>` in `AGENTS.md` is present.

### [ADP-0302]

Manage global skills carefully in `~/.gemini/skills/` and prune unused scripts to prevent token bloat.

### [ADP-0303]

Aggressively use `.geminiignore` to exclude build artifacts, logs, binaries, and dependencies from context, preventing token waste.

### [ADP-0304]

Use checkpoints via artifacts to preserve context in long sessions. Reinforce destructive command constraints, as Gemini tends to be highly proactive.

---

## Lifecycle & Spec System

### [CORE-02]

The repository is your memory. Persist plans, progress, debts, knowledge, and roadmap under `.specify/specs/`. Read `.specify/specs/roadmap/backlog.md` at session start. If the platform forces a scratchpad, write only a pointer to the spec file. Planning trapped in agent cache (AI-slop) is unacceptable.

### [CORE-11]

Act only with a formed plan. Use `spec-foundation` for work that must survive session/agent changes; use a tool-scratchpad lightweight plan only for single-session, local, disposable adjustments.

### [CORE-12]

After absorbing extensive context, return a summary Checkpoint and request human approval before executing Code Actions.

### [CORE-13]

Keep SDD artifacts updated continuously: mark `tasks.md` items `[/]` (in progress) or `[x]` (done) as you go; record debts in `NEXT.md`. Never create parallel routing files in the repo.

### [GR-0101]

Declare the spec type (evidence-driven, deterministic, or mixed) and require human approval when design depends on unresolved evidence.

### [GR-0102]

When measuring the token cost of new guidelines, use the Tok-H heuristic: aggregate characters divided by 3.5. Ensure the resulting payload respects established soft ceilings (6000 aggregate, 1500 universal, 600 adapter, 1200 opt-in).

### [GR-0202]

Exclude irrelevant files (logs, builds, dependencies) from the AI context using ignore files.

---

## Git & PR Workflow

### [CORE-04]

Never start active modifications on `main` or `master`. Create a synthetic branch (`feat/`, `fix/`, `docs/`) before changing sources of truth.

### [CORE-05]

Do not version stray context files at the repo root or in working folders (partial payloads, AI scratch). Persistence is for _Release_ only.

### [CORE-06]

Make atomic incremental commits limited to one logical unit. Split tasks that span design + code + spec.

### [CORE-07]

**[CRITICAL]** Never execute `git push` autonomously. Any remote push requires explicit human approval from the maintainer.

### [CORE-08]

**[HARNESS LOCK]** Before any `git commit`, run the project's full validation chain (format, check, lint, test) as declared in `package.json`. The rule is the chain, not the package manager — adapt to project scripts.

### [CORE-09]

Open Pull Requests in `Draft` mode using the full `.github/pull_request_template.md` matrix.

### [CORE-10]

Convert PRs from `Draft` to `Ready` only after explicit human revalidation.

### [CORE-14]

At the end of each sub-block, provide only the commit message suggestion. The human executes the full validation chain (`yarn format ; yarn check ; ...`) and `git commit`.

### [GR-0203]

Build PR descriptions in three steps: outline topics, get human approval, then generate the final text using the repository template (if available) and perform a final human validation.

---

## Engineering Principles

### [GR-0001]

Never expose secrets in frontend code or versioned files. Store them in environment variables and ensure they are ignored by version control.

### [GR-0002]

Do not bypass the type system. Avoid unsafe casts (`any`, `unknown`, prototype manipulation) and use explicit type guards or generics.

### [GR-0003]

Use immutable data structures and pure functions. Do not mutate shared state.

### [GR-0004]

Fail fast and propagate errors explicitly. Do not swallow exceptions or use empty catch blocks.

### [GR-0005]

Make concurrency explicit: use `Promise.all` for independent tasks and `await` sequencing for dependent ones. Do not use fire-and-forget without error handling.

### [GR-0006]

Never install, add, or upgrade third-party packages autonomously. When new dependencies are needed, propose the exact package name and version, and wait for explicit human approval before running any install command (`npm install`, `pip install`, `cargo add`, `gem install`, `go get`, etc.). This applies to all package manifests: `package.json`, `requirements.txt`, `Cargo.toml`, `Gemfile`, `go.mod`, and equivalents.

---

## Center Zone: Opt-in Methodologies

<FEATURE_BDD>

### [OPT-0201]

All tests MUST use the GIVEN / WHEN / THEN structure in Brazilian Portuguese (DADO/QUANDO/ENTÃO). Each `it()` describes exactly one atomic scenario. Prioritize readability over brevity. If a business rule `[BR-*]` is provided, include it in the test name.

</FEATURE_BDD>

<FEATURE_TDD>

### [OPT-0501]

Every new feature or bug fix MUST follow the RED -> GREEN -> REFACTOR cycle. Write a failing test first. Never skip the RED step. Write minimum code to pass. Maintain >85% coverage. Test files must be colocated. Unit tests must be isolated with mocks/stubs. If a business rule `[BR-*]` is provided, include it in the test name.

</FEATURE_TDD>

<FEATURE_QUALITY_GATES>

### [OPT-0301]

Before reporting a task as done, ensure: no circular dependencies, proper teardown for listeners/timers (prevent memory leaks), no unguarded asynchronous state mutations (prevent race conditions), >85% test coverage, >60% mutation kill rate, and no secrets in code/comments. Fix any automated failures before requesting human review.

</FEATURE_QUALITY_GATES>

---

## Base Zone: Tactical Context

> [!IMPORTANT]
> This project uses the **ai-guidelines** framework for AI governance.
> Operational guidelines and engineering rules are compiled within the `<AI_GUIDELINES>` block in `AGENTS.md`.

### Centralized Governance

The root `AGENTS.md` is the runtime artifact. Project-specific content must remain outside of the `<AI_GUIDELINES>` block.

### Consumer Bootstrap

Consumer-local ai-guidelines assets live under `.ai-guidelines/`. Templates mirrored by the CLI live in `.ai-guidelines/templates/`. Specs and roadmap remain under `.specify/specs/`.

</AI_GUIDELINES>
