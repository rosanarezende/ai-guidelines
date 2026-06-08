# Scripts canonicos do `ai-guidelines`

> Arquivo gerado por `.core/governance/script-contracts.yml`.
> Nao edite manualmente: rode `yarn script-contracts:sync`.

Este documento e a referencia humana do contrato operacional que tambem projeta
`package.json#scripts`, `.husky/*` e templates de consumidores. O check
`yarn script-contracts:check` falha quando alguma projecao diverge.

## Visao por categoria

| Intencao              | Scripts                                                                                                                                                                                                                                                                                          |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI (dogfooding)      | `guidelines`, `guidelines:init`, `guidelines:adopt`, `guidelines:providers`                                                                                                                                                                                                                      |
| Setup inicial / build | `setup`, `build`, `build:rules`, `build:all`                                                                                                                                                                                                                                                     |
| Format                | `format`, `format:check`, `lint-staged`                                                                                                                                                                                                                                                          |
| Tests                 | `test`, `test:unit`, `test:ts`, `test:smoke`, `test:coverage`                                                                                                                                                                                                                                    |
| Living docs           | `living-docs:generate`, `living-docs:check`                                                                                                                                                                                                                                                      |
| Guards de governanca  | `state-yml:check`, `state-yml:check:all`, `active-specs:check`, `reconcile:check`, `co-knowledge:check`, `co-knowledge:inventory`, `script-contracts:sync`, `script-contracts:check`, `gate-decidability:check`, `ruleset:check`, `review:check`, `insights:check`, `intent:check`, `disclosure` |
| Aggregate (gates)     | `validate`, `ci`                                                                                                                                                                                                                                                                                 |
| Lifecycle npm         | `prepare`, `prepack`                                                                                                                                                                                                                                                                             |

## Tabela completa

| Script                    | Comando                                                                                                                                                                                                                                                                                                                                                                 | Categoria             | Modifica arquivos? | Consumidores                  | Descricao                                                              |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- | :----------------: | :---------------------------- | :--------------------------------------------------------------------- |
| `guidelines`              | `node cli/ai-guidelines-cli.mjs`                                                                                                                                                                                                                                                                                                                                        | CLI (dogfooding)      |        nao         | `human`                       | Invocacao local da CLI.                                                |
| `guidelines:init`         | `node cli/ai-guidelines-cli.mjs init`                                                                                                                                                                                                                                                                                                                                   | CLI (dogfooding)      |        sim         | `human`                       | Bootstrap de consumidor via CLI.                                       |
| `guidelines:adopt`        | `node cli/ai-guidelines-cli.mjs adopt`                                                                                                                                                                                                                                                                                                                                  | CLI (dogfooding)      |        sim         | `human`                       | Adocao/atualizacao de consumidor existente.                            |
| `guidelines:providers`    | `node cli/ai-guidelines-cli.mjs providers`                                                                                                                                                                                                                                                                                                                              | CLI (dogfooding)      |        nao         | `human`                       | Lista provider adapters disponiveis.                                   |
| `setup`                   | `yarn install --immutable && yarn build:all`                                                                                                                                                                                                                                                                                                                            | Setup inicial / build |        sim         | `human`                       | Primeira instalacao local do repositório.                              |
| `build`                   | `tsc`                                                                                                                                                                                                                                                                                                                                                                   | Setup inicial / build |        sim         | `script`                      | Compila TypeScript de src/ para dist/.                                 |
| `build:rules`             | `node cli/governance/monolith/rules-builder.mjs`                                                                                                                                                                                                                                                                                                                        | Setup inicial / build |        sim         | `script`, `hook`              | Gera rules.json e ledger derivado.                                     |
| `build:all`               | `yarn build && yarn build:rules`                                                                                                                                                                                                                                                                                                                                        | Setup inicial / build |        sim         | `script`, `hook`, `lifecycle` | Build completo do runtime e das regras.                                |
| `format`                  | `prettier --write .`                                                                                                                                                                                                                                                                                                                                                    | Format                |        sim         | `human`                       | Formata todos os arquivos.                                             |
| `format:check`            | `prettier --check .`                                                                                                                                                                                                                                                                                                                                                    | Format                |        nao         | `script`                      | Verifica formatacao sem alterar arquivos.                              |
| `lint-staged`             | `lint-staged`                                                                                                                                                                                                                                                                                                                                                           | Format                |        sim         | `hook`                        | Formata arquivos staged e re-stageia alteracoes.                       |
| `test`                    | `yarn test:unit && yarn test:ts`                                                                                                                                                                                                                                                                                                                                        | Tests                 |        nao         | `script`                      | Agregado das suites mjs e TypeScript.                                  |
| `test:unit`               | `node --experimental-default-config-file --test cli/**/*.test.mjs cli/**/**/*.test.mjs tests/integration/**/*.test.mjs`                                                                                                                                                                                                                                                 | Tests                 |        nao         | `script`, `hook`              | Suite mjs rapida usada no pre-commit.                                  |
| `test:ts`                 | `jest --config ./.jest/jest.config.js`                                                                                                                                                                                                                                                                                                                                  | Tests                 |        nao         | `script`                      | Suite TypeScript/Jest.                                                 |
| `test:smoke`              | `yarn build && node --experimental-default-config-file --test tests/smoke/*.test.mjs`                                                                                                                                                                                                                                                                                   | Tests                 |        sim         | `script`, `workflow`          | Smoke cross-plataforma sobre pacote gerado.                            |
| `test:coverage`           | `node --experimental-default-config-file --experimental-test-coverage --test cli/**/*.test.mjs cli/**/**/*.test.mjs tests/integration/**/*.test.mjs && jest --config ./.jest/jest.config.js --coverage`                                                                                                                                                                 | Tests                 |        nao         | `human`                       | Cobertura combinada das suites mjs e Jest.                             |
| `living-docs:generate`    | `yarn build && node cli/living-docs.mjs generate`                                                                                                                                                                                                                                                                                                                       | Living docs           |        sim         | `human`                       | Regenera living docs.                                                  |
| `living-docs:check`       | `yarn build && node cli/living-docs.mjs check`                                                                                                                                                                                                                                                                                                                          | Living docs           |        sim         | `script`                      | Verifica drift dos living docs.                                        |
| `state-yml:check`         | `yarn build && node cli/state-yml-check.mjs`                                                                                                                                                                                                                                                                                                                            | Guards de governanca  |        sim         | `script`                      | Valida state.yml operacionais e tocados no diff local.                 |
| `state-yml:check:all`     | `yarn build && node cli/state-yml-check.mjs --all`                                                                                                                                                                                                                                                                                                                      | Guards de governanca  |        sim         | `script`, `workflow`          | Varredura historica/global de todos os state.yml.                      |
| `active-specs:check`      | `yarn build && node cli/active-specs-check.mjs`                                                                                                                                                                                                                                                                                                                         | Guards de governanca  |        sim         | `script`                      | Verifica coerencia da projection active-specs.yml.                     |
| `reconcile:check`         | `yarn build && node cli/reconcile-check.mjs`                                                                                                                                                                                                                                                                                                                            | Guards de governanca  |        sim         | `script`                      | Advisory de continuidade operacional/canonical-next.                   |
| `co-knowledge:check`      | `yarn build && node cli/co-knowledge-check.mjs`                                                                                                                                                                                                                                                                                                                         | Guards de governanca  |        sim         | `script`                      | Advisory de Falsification/Knowledge.                                   |
| `co-knowledge:inventory`  | `yarn build && node cli/co-knowledge-inventory.mjs`                                                                                                                                                                                                                                                                                                                     | Guards de governanca  |        sim         | `script`                      | Check required do inventario minimo de conhecimento.                   |
| `script-contracts:sync`   | `node cli/script-contracts.mjs sync`                                                                                                                                                                                                                                                                                                                                    | Guards de governanca  |        sim         | `human`, `hook`               | Sincroniza package.json, hooks, templates e docs a partir do contrato. |
| `script-contracts:check`  | `node cli/script-contracts.mjs check`                                                                                                                                                                                                                                                                                                                                   | Guards de governanca  |        nao         | `script`                      | Falha se scripts, hooks, templates ou docs divergirem do contrato.     |
| `gate-decidability:check` | `node cli/governance/gate-decidability-check.mjs`                                                                                                                                                                                                                                                                                                                       | Guards de governanca  |        nao         | `script`                      | GG-0001; DECs nao-resolvidos precisam ser decidiveis.                  |
| `ruleset:check`           | `yarn build && node cli/ruleset-check.mjs`                                                                                                                                                                                                                                                                                                                              | Guards de governanca  |        sim         | `script`, `workflow`          | Producibilidade dos required contexts; --parity para ruleset vivo.     |
| `review:check`            | `yarn build && node cli/review-check.mjs`                                                                                                                                                                                                                                                                                                                               | Guards de governanca  |        sim         | `script`                      | Verifica artefatos de review/gate e fingerprints.                      |
| `insights:check`          | `yarn build && node cli/insights-check.mjs`                                                                                                                                                                                                                                                                                                                             | Guards de governanca  |        sim         | `script`                      | Valida ledger de insights.                                             |
| `intent:check`            | `yarn build && node cli/intent-check.mjs`                                                                                                                                                                                                                                                                                                                               | Guards de governanca  |        sim         | `script`                      | Verifica intencao/governanca de PR.                                    |
| `disclosure`              | `yarn build && node cli/disclosure-render.mjs`                                                                                                                                                                                                                                                                                                                          | Guards de governanca  |        sim         | `human`                       | Renderiza disclosure de IA derivado.                                   |
| `validate`                | `yarn format:check && yarn build:all && yarn script-contracts:check && yarn test && yarn living-docs:check && yarn state-yml:check && yarn active-specs:check && yarn reconcile:check && yarn co-knowledge:check && yarn co-knowledge:inventory && yarn gate-decidability:check && yarn ruleset:check && yarn review:check && yarn insights:check && yarn intent:check` | Aggregate (gates)     |        sim         | `hook`, `workflow`, `human`   | Gate local operacional e pre-push.                                     |
| `ci`                      | `yarn install --immutable && yarn validate && yarn state-yml:check:all && yarn test:smoke`                                                                                                                                                                                                                                                                              | Aggregate (gates)     |        sim         | `workflow`, `human`           | Pipeline completo replicavel fora do GitHub.                           |
| `prepare`                 | `husky`                                                                                                                                                                                                                                                                                                                                                                 | Lifecycle npm         |        sim         | `lifecycle`                   | Instala hooks Husky.                                                   |
| `prepack`                 | `yarn build:all`                                                                                                                                                                                                                                                                                                                                                        | Lifecycle npm         |        sim         | `lifecycle`                   | Garante dist/ e rules.json antes de empacotar.                         |

## Hooks de git

Os hooks versionados em `.husky/` sao projecoes do contrato. Eles devem estar
instalados no clone local via `yarn setup` ou `yarn prepare`. Se um agente
perceber que hooks nao estao instalados, deve parar e restaurar o setup; nao deve
usar `--no-verify` nem inventar uma cadeia manual paralela.

### `pre-commit`

```bash
#!/bin/sh

if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-${HOME:-}/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    if [ -f ".nvmrc" ]; then
      nvm use --silent >/dev/null 2>&1 || true
    else
      nvm use --silent default >/dev/null 2>&1 || true
    fi
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ai-guidelines hook: node não encontrado no PATH e nvm não pôde ser carregado." >&2
  echo "Restaure o ambiente (ex.: nvm install && nvm use) e rode yarn setup; não use --no-verify." >&2
  exit 127
fi

node .yarn/releases/yarn-4.1.1.cjs lint-staged
node .yarn/releases/yarn-4.1.1.cjs script-contracts:sync
node .yarn/releases/yarn-4.1.1.cjs build:all
git add package.json docs/scripts.md .husky/pre-commit .husky/pre-push .core/templates/package.json.fragment.json .core/templates/.husky/pre-commit.tmpl .core/templates/.husky/pre-push.tmpl .core/templates/.github/workflows/ai-guidelines-ci.yml.tmpl .core/rules/_meta/rules.json .core/rules/_meta/agents-core-ledger.md .core/rules/catalog.md AGENTS.md
node .yarn/releases/yarn-4.1.1.cjs test:unit
```

### `pre-push`

```bash
#!/bin/sh

if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-${HOME:-}/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    if [ -f ".nvmrc" ]; then
      nvm use --silent >/dev/null 2>&1 || true
    else
      nvm use --silent default >/dev/null 2>&1 || true
    fi
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ai-guidelines hook: node não encontrado no PATH e nvm não pôde ser carregado." >&2
  echo "Restaure o ambiente (ex.: nvm install && nvm use) e rode yarn setup; não use --no-verify." >&2
  exit 127
fi

node .yarn/releases/yarn-4.1.1.cjs validate
```

## Workflows de CI

| Workflow                                | Runs contratados                                                    |
| :-------------------------------------- | :------------------------------------------------------------------ |
| `.github/workflows/repo-validation.yml` | `yarn validate`<br>`yarn state-yml:check:all`                       |
| `.github/workflows/release.yml`         | `yarn ci`                                                           |
| `.github/workflows/smoke-multi-os.yml`  | `yarn test:smoke`                                                   |
| `.github/workflows/ruleset-drift.yml`   | `node cli/ruleset-check.mjs --parity --live /tmp/live-ruleset.json` |

## Contrato de commit

O metodo operacional interno e: scripts declarados em
`.core/governance/script-contracts.yml` projetam hooks e docs; o `pre-commit`
executa sincronizacao, build e testes rapidos; o `pre-push` executa
`yarn validate`; e o CI acrescenta a varredura historica quando aplicavel.

Antes de commitar, nao existe mais uma cadeia textual duplicada para copiar. A
regra e garantir que os hooks estejam instalados e deixar o contrato rodar. Para
checagem manual ou diagnostico, use:

```bash
yarn script-contracts:sync
yarn validate
```

## Consumidores

O baseline de consumidor tambem e projetado daqui:

- `.core/templates/package.json.fragment.json`
- `.core/templates/.husky/pre-commit.tmpl`
- `.core/templates/.husky/pre-push.tmpl`
- `.core/templates/.github/workflows/ai-guidelines-ci.yml.tmpl`
