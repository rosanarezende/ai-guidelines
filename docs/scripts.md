# Scripts canônicos do `ai-guidelines`

> **Referência única** para o que cada script no [`package.json`](../package.json) faz, como compõe os hooks de git e quais workflows o consomem. AGENTS.md e CONTRIBUTING.md apontam para cá em vez de duplicar.

Estrutura:

- [Visão por categoria](#visão-por-categoria) — mapa rápido por intenção.
- [Tabela completa](#tabela-completa) — composição + onde é chamado.
- [Hooks de git](#hooks-de-git) — o que dispara quando você faz commit/push.
- [Workflows de CI](#workflows-de-ci) — o que dispara em PRs.
- [Cadeia canônica de validação local](#cadeia-canônica-de-validação-local) — o comando que o agente IA deve usar antes de cada commit.

---

## Visão por categoria

| Intenção                  | Scripts                                                                     |
| :------------------------ | :-------------------------------------------------------------------------- |
| Setup inicial / build     | `setup`, `build`, `build:rules`, `build:all`                                |
| Format                    | `format` (write), `format:check` (lint)                                     |
| Tests                     | `test`, `test:unit`, `test:ts`, `test:smoke`, `test:coverage`               |
| Living docs (drift guard) | `living-docs:generate`, `living-docs:check`                                 |
| Aggregate (gates)         | `validate` (gate local + pre-push), `ci` (pipeline completo replicável)     |
| CLI (dogfooding)          | `guidelines`, `guidelines:init`, `guidelines:adopt`, `guidelines:providers` |
| Lifecycle npm             | `prepare` (auto-install husky), `prepack` (build antes de empacotar)        |

---

## Tabela completa

| Script                 | Composição                                                                                                                      | Modifica arquivos? | Onde é chamado                                                                                   |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :----------------: | :----------------------------------------------------------------------------------------------- |
| `guidelines`           | `node cli/ai-guidelines-cli.mjs`                                                                                                |        não         | invocação local da CLI                                                                           |
| `guidelines:init`      | `node cli/ai-guidelines-cli.mjs init`                                                                                           |        sim¹        | bootstrap em consumidor                                                                          |
| `guidelines:adopt`     | `node cli/ai-guidelines-cli.mjs adopt`                                                                                          |        sim¹        | atualização de consumidor existente                                                              |
| `guidelines:providers` | `node cli/ai-guidelines-cli.mjs providers`                                                                                      |        não         | lista provider adapters disponíveis                                                              |
| `setup`                | `yarn install --immutable && yarn build:all`                                                                                    |        sim         | primeira instalação do repo                                                                      |
| `build`                | `tsc` (compila `src/` → `dist/`)                                                                                                |        sim         | dependência de `build:all`, `living-docs:*`                                                      |
| `build:rules`          | `node cli/governance/monolith/rules-builder.mjs` (gera `rules.json` + ledger)                                                   |        sim         | dependência de `build:all`                                                                       |
| `build:all`            | `yarn build && yarn build:rules`                                                                                                |        sim         | pre-commit hook (passo 2); `prepack`; dentro de `validate`                                       |
| `format`               | `prettier --write .` (todos os arquivos)                                                                                        |        sim         | manual antes do commit                                                                           |
| `format:check`         | `prettier --check .` (todos, sem alterar)                                                                                       |        não         | dentro de `validate`                                                                             |
| `test`                 | `yarn test:unit && yarn test:ts`                                                                                                |        não         | dentro de `validate`                                                                             |
| `test:unit`            | `node --test cli/**/*.test.mjs cli/**/**/*.test.mjs tests/integration/**/*.test.mjs` (suite mjs; smoke isolado em `test:smoke`) |        não         | pre-commit hook (passo 3); dentro de `test`                                                      |
| `test:ts`              | `jest --config ./.jest/jest.config.js` (suite TypeScript em `src/`)                                                             |        não         | dentro de `test`                                                                                 |
| `test:smoke`           | `yarn build && node --test tests/smoke/*.test.mjs`                                                                              |        sim²        | dentro de `ci`; workflow `smoke-multi-os.yml`                                                    |
| `test:coverage`        | mjs (mesmos globs de `test:unit` — sem smoke) com `--experimental-test-coverage` + `jest --coverage`                            |        não         | manual / análise ad-hoc                                                                          |
| `living-docs:generate` | `yarn build && node cli/living-docs.mjs generate`                                                                               |        sim²        | manual quando atualizar manifesto                                                                |
| `living-docs:check`    | `yarn build && node cli/living-docs.mjs check`                                                                                  |        sim²        | dentro de `validate`                                                                             |
| `validate`             | `yarn format:check && yarn build:all && yarn test && yarn living-docs:check`                                                    |        sim²        | **pre-push hook**; workflows `ai-guidelines-ci.yml` + `content-guardrails.yml`                   |
| `ci`                   | `yarn install --immutable && yarn validate && yarn test:smoke`                                                                  |        sim²        | pipeline completo replicável fora do GitHub (ou em workflow externo que queira smoke + validate) |
| `prepare`              | `husky` (instala hooks `.husky/*` no `.git/hooks/`)                                                                             |        sim         | npm install lifecycle (auto)                                                                     |
| `prepack`              | `yarn build:all`                                                                                                                |        sim         | npm publish lifecycle (auto, garante `dist/` + `rules.json` no tarball)                          |
| `lint-staged`          | binário direto do pacote `lint-staged` (config em `.lintstagedrc.json`)                                                         |        sim         | pre-commit hook (passo 1)                                                                        |

¹ modifica somente o repositório-alvo (`--target`), não este.
² gera artefatos em `dist/` ou compila TypeScript como efeito colateral; não modifica fontes versionadas exceto quando explicitamente solicitado (`living-docs:generate`).

---

## Hooks de git

Configurados em [`.husky/`](../.husky/) e instalados automaticamente via `prepare`.

### `pre-commit` (espelhado em `.husky/pre-commit`)

```bash
yarn lint-staged                                                          # 1. prettier --write somente nos staged (re-stage automático)
yarn build:all                                                            # 2. compila TS (src→dist) + reconstrói rules.json + ledger
git add .core/rules/_meta/rules.json .core/rules/_meta/agents-core-ledger.md  # 3. re-stage derivados regenerados pelo build:rules
yarn test:unit                                                            # 4. suite mjs (rápida; testes TS ficam para pre-push)
```

**Quando dispara:** `git commit`.
**Por que esse escopo:** lint-staged garante format incremental (rápido); build:all detecta quebras de TypeScript imediatamente; **passo 3 é crítico** — sem ele, edits em `.core/rules/` podem ser commitadas sem que `rules.json`/ledger reflitam o estado real (lint-staged só re-stageia o que ele próprio formatou, e build:all modifica working tree sem stage); test:unit pega regressões na camada principal sem o custo de jest. Testes jest (`test:ts`) e living-docs são deixados para o `pre-push`.

### `pre-push` (espelhado em `.husky/pre-push`)

```bash
yarn validate       # format:check + build:all + test (mjs + jest) + living-docs:check
```

**Quando dispara:** `git push`.
**Por que esse escopo:** espelha exatamente o que os workflows de CI rodam — se passa local, passa em CI.

---

## Workflows de CI

Configurados em [`.github/workflows/`](../.github/workflows/).

| Workflow                 | Trigger                          | Script principal             |
| :----------------------- | :------------------------------- | :--------------------------- |
| `ai-guidelines-ci.yml`   | `pull_request`, `push` em `main` | `yarn validate`              |
| `content-guardrails.yml` | `pull_request`, `push` em `main` | `yarn validate`              |
| `smoke-multi-os.yml`     | `pull_request`, `push` em `main` | `yarn test:smoke` (multi-OS) |

**Filosofia:** os workflows são desacoplados. `ai-guidelines-ci` e `content-guardrails` cobrem quality gates determinísticos (atualmente redundantes — herança histórica que será consolidada em `repo-validation.yml` por uma PR separada — feat/spec-0023-lifecycle); `smoke-multi-os` cobre cross-plataforma. Workflows adicionais (`governance-pr-check.yml` para contrato de PR cf. Spec 0023 + ADR 0020) entram em main via PR stacked sobre este trabalho.

---

## Cadeia canônica de validação local

A cadeia obrigatória antes de cada `git commit` (cf. [`AGENTS.md`](../AGENTS.md) § HARNESS LOCK e [`.core/rules/top/agents-core.md`](../.core/rules/top/agents-core.md) `[CORE-08]`):

```bash
yarn format ; yarn validate ; git add . ; git commit -m "..."
```

- `yarn format` aplica prettier em todos os arquivos (write).
- `yarn validate` é o **gate local** (mesmo que o pre-push hook executa).
- O `pre-commit` hook re-roda format incremental (via lint-staged) + build + test:unit, então a cadeia acima é "belt-and-suspenders": se rodar `format` antes, lint-staged não terá o que fazer. Se pular `validate`, o `pre-push` cobre antes do remote.

> **Em outros stacks.** A regra é a **cadeia** (format → check → build → test → docs guard → commit), não os comandos concretos. Adapte aos scripts do projeto consumidor (`npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
