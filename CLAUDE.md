# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Identidade do repositório

Este repositório **é o próprio framework `ai-guidelines`** — não um projeto que o consome. Aqui se desenvolve o baseline canônico (`.core/`) e a CLI (`cli/`) que outros projetos instalam via `init` / `adopt`. Toda mudança em regras ou templates altera o que será injetado em **todos** os repositórios consumidores.

`AGENTS.md` na raiz é simultaneamente:

- Documentação operacional para humanos/IA contribuindo aqui.
- O artefato runtime de exemplo, com o bloco `<AI_GUIDELINES>` compilado por este mesmo CLI.

Editar `AGENTS.md` à mão **dentro** do bloco `<AI_GUIDELINES>` é incorreto: o conteúdo dali é gerado a partir de `.core/rules/`. Conteúdo do projeto vive **fora** das tags `<AI_GUIDELINES>`.

## Comandos essenciais

Yarn 4 (PnP) é o gerenciador canônico — `.pnp.cjs` e `.pnp.loader.mjs` são versionados.

```bash
yarn install --immutable     # bootstrap (lockfile não muta)
yarn format                  # prettier --write .
yarn check                   # prettier --check .
yarn test                    # node --test sobre cli/**/*.test.mjs e tests/**
yarn test:coverage           # idem, com --experimental-test-coverage
yarn check:repo              # install + check + test:coverage (pipeline CI)
```

Rodar a CLI localmente contra um diretório alvo:

```bash
node cli/ai-guidelines-cli.mjs init   --target ../novo-projeto --name novo-projeto
node cli/ai-guidelines-cli.mjs adopt  --target ../repo-existente --dry-run
node cli/ai-guidelines-cli.mjs adopt  --target ../repo-existente --force
```

Sem argumentos em TTY, a CLI inicia o **Wizard** interativo (`cli/cli/args.mjs`). Em CI, sempre passe flags explícitas.

Executar um único arquivo de teste:

```bash
node --test cli/app/engine.test.mjs
node --test --test-name-pattern='BR-CLI-SYNC-01' cli/governance/agents-merge.test.mjs
```

## Cadeia obrigatória de commit (HARNESS LOCK)

`AGENTS.md` impõe a cadeia abaixo. **Nunca** rode `git commit` isolado:

```bash
yarn format ; yarn check ; git add . ; git commit -m "..."
```

E **nunca** execute `git push` autonomamente — exige aprovação humana explícita. Husky (`.husky/`) replica os gates localmente.

## Arquitetura

A CLI segue um pipeline em `cli/app/engine.mjs:execute()`:

1. **Parsing** — `cli/cli/args.mjs` resolve flags ou dispara o Wizard quando faltam chaves obrigatórias.
2. **Detecção de contexto** — `cli/formatters/package-context.mjs` identifica package manager (npm/pnpm/yarn/bun), formatter rival (biome, dprint, rome, standard) e monorepo (workspaces).
3. **Safety check em `init`** — `cli/governance/agents-merge.mjs` aborta se há conflitos sem `--force`.
4. **Core (mandatório)** — `applyPointers` + `applyGitattributes`. `applyPointers` invoca o **Monolith Compiler**.
5. **Opt-in de infraestrutura** — `applyPrettier`, `applyHusky`, `applyCi` (modificam `package.json`, hooks, CI/CD do alvo).

### Monolith Compiler (governance core)

`cli/governance/monolith/compiler.mjs` produz o conteúdo do bloco `<AI_GUIDELINES>` no `AGENTS.md` do consumidor:

- `coreTemplate` (`.core/templates/AGENTS-core.md.tmpl`) → diretivas primárias.
- `globalRules` (`.core/rules/global-rules.md`) → princípios universais.
- `providerRules` (`.core/rules/{claude,codex,gemini}.md`) → adapters por IA.
- `optInRules` (`.core/rules/opt-in/*.md`) → empacotadas em tags `<FEATURE_*>` via `wrapFeatureModule()`. Apenas features ativas são injetadas; `--prune` remove tags órfãs.
- `pointerTemplate` (`.core/templates/AGENTS-pointer.md.tmpl`) → zona base (contexto tático).

A divisão "universal vs opt-in" é canônica (Spec 0008): regras de **governança IA agnósticas** vivem em `global-rules.md` (sempre injetadas). Regras dependentes de **stack/processo** vivem em `.core/rules/opt-in/` e em `cli/features/opt-in/editorial/` (Wizard pergunta).

### Categorias de feature (taxonomia)

Definidas em `cli/cli/args.mjs`:

- `EDITORIAL_FEATURES` (`quality-gates`, `tdd`, `bdd`) → injetam blocos `<FEATURE_*>` no `AGENTS.md`. Source em `.core/rules/opt-in/`, código em `cli/features/opt-in/editorial/`.
- `INFRASTRUCTURE_FEATURES` (`prettier`, `husky`, `ci`) → modificam `package.json`, hooks, workflow. Source em `.core/templates/`, código em `cli/features/opt-in/infrastructure/`.

Ao adicionar uma feature, mantenha as duas listas como única fonte de verdade — `FEATURE_OPTIONS` e `OPT_IN_RULE_FILES` são derivadas delas.

### Subpath imports

`package.json` declara aliases internos. Use **sempre** estes prefixos em vez de paths relativos:

| Alias                    | Diretório                       |
| :----------------------- | :------------------------------ |
| `#app/*`                 | `cli/app/*.mjs`                 |
| `#cli/*`                 | `cli/cli/*.mjs`                 |
| `#features/*`            | `cli/features/*.mjs`            |
| `#formatters/*`          | `cli/formatters/*.mjs`          |
| `#governance/*`          | `cli/governance/*.mjs`          |
| `#governance/monolith/*` | `cli/governance/monolith/*.mjs` |
| `#fs/*`                  | `cli/fs/*.mjs`                  |

### Convenção de testes (BDD + rastreabilidade)

- **Co-location**: `engine.mjs` ↔ `engine.test.mjs` no mesmo diretório.
- **Formato BDD obrigatório** em PT-BR: `it("DADO ... QUANDO ... ENTÃO ...", ...)`.
- **Rastreabilidade `[BR-*]`**: testes que validam Business Rules em `docs/cli/ai-guidelines-cli.md` carregam o ID no nome (ex.: `[BR-CLI-SYNC-01]`).
- Mínimos canônicos (Quality Gates feature): cobertura ≥ 85%, mutation kill-rate ≥ 60%.
- Tests de integração end-to-end vivem em `tests/integration/`.

## Workflow SDD (Spec-Driven Development)

Trabalho não-trivial vive em `.specify/specs/<slug>/`. Não escreva planos em scratchpad da ferramenta.

- Bootstrap obrigatório: leia `.specify/specs/roadmap/backlog.md` no início de cada sessão para ver specs ativas e prioridades.
- Estrutura por spec: `spec.md` (imutável após "In Review"), `plan.md` (vivo), `tasks.md` (checklist `[ ]` / `[/]` / `[x]`), `NEXT.md` (débitos — deletar no encerramento), `research/` (migra para `.specify/specs/researchs/<domínio>/` ao fechar).
- Templates canônicos em `.specify/templates/`.
- Numeração: candidatas no backlog vivem por slug; o número (`0008-...`) é alocado quando saem do backlog para uma branch.
- Branches: `feat/spec-XXXX-<slug>`, `fix/<descrição>`, `docs/<descrição>`. **Nunca** alterar `main` diretamente.
- Lifecycle completo em `docs/process/spec-foundation.md`. Ciclo RPI (Research → Plan → Implement) em `docs/rpi-protocol.md`.

## Princípios não-óbvios deste código

- **Idioma**: respostas, comentários relevantes e mensagens da CLI em **PT-BR**. Templates editoriais podem ter variantes `*-en.md` (ex.: `tdd-en.md`).
- **Tipagem estrita mesmo sendo JS**: proibido `any` mental, coerções inseguras, manipulação de prototype. Use type-guards explícitos e early-return.
- **Fail-fast**: nunca `try/catch` vazio nem que apenas faça `console.log`. Se capturar, propague ou recupere estado. A exceção em `engine.mjs:147-153` é deliberada (degradação graceful de features opt-in) e deve **continuar reportando** via `actions.push`.
- **Concorrência explícita**: declarar a intenção (`Promise.all` para paralelo independente; `for...of` + `await` para dependente). Sem fire-and-forget em fluxos críticos.
- **EOL awareness**: o código detecta Windows e emite guidance de `git add --renormalize` quando `.gitattributes` muda (`engine.mjs:45-54`).
- **Não-substituição silenciosa**: `adopt` só sobrescreve com `--force`; `init` aborta com conflitos sem `--force`. Esse contrato é testado — preservá-lo.

## Adapter Claude

- `.core/rules/CLAUDE.md` é o **adapter Claude do framework** (vai para o consumidor). Não é instrução para esta sessão; este arquivo (`/CLAUDE.md` na raiz) é.
- Se editar regras Claude-específicas a serem distribuídas, edite `.core/rules/claude.md` (ou `CLAUDE.md` dentro de `.core/rules/`, conforme sincronizado pelo loader em `cli/governance/monolith/rules-loader.mjs`).
