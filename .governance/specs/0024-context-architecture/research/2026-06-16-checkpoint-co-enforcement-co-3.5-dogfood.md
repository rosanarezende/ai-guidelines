# CO-3.5 — dogfood do colapso integral do runtime CLI

> Registro factual do fechamento técnico do sub-checkpoint interno CO-3.5 no PR #42
> (`co-enforcement`, modo unit). Este arquivo não executa Human Gate, Ready,
> merge nem avanço de checkpoint; registra evidências para a decisão humana.

## Escopo Fechado

CO-3.5 eliminou a árvore-fonte `/cli` como superfície executável e deslocou o
bootstrap público para `dist/cli/main.js`, preservando `src/cli` como delivery TS
e `CommandRegistry` como fonte de comandos/help.

Estado terminal verificado:

- `/cli` inexistente fisicamente.
- `package.json#bin = "dist/cli/main.js"`.
- scripts `guidelines`, `guidelines:init` e `guidelines:adopt` executam `node dist/cli/main.js`.
- `package.json#files` publica `dist`, não `cli`.
- `package.json#imports` não aponta para `./cli/**`.
- `LegacyExecuteFn` e `loadLegacyExecute` inexistentes.
- runtime ativo não registra `providers`.
- `providers` falha como comando desconhecido e orienta `guidelines update --providers <lista>`.

## Diferenças Intencionais

`providers` não existe no runtime novo por decisão da owner. O comportamento
operacional foi absorvido por:

```bash
guidelines update --providers claude,openai
```

O erro para `guidelines providers` é orientado, mas não é alias nem delegação.

## Readiness Terminal

Antes de marcar readiness, foi encontrado drift real no runtime governado:

- `work` ainda tratava readiness do último sub-checkpoint como implementação ativa.
- `decide --type advance-subcheckpoint --brief-only` ainda projetava uma decisão
  bloqueada quando não havia próximo sub-checkpoint pendente.
- `human-gate` não nomeava readiness como bloqueio quando o sub-checkpoint ativo
  ainda não tinha readiness.

Correção mínima implementada em `25d7299`:

- `resolveSubCheckpointWork` ganhou o estado `terminal-ready`.
- readiness com próximo pendente continua projetando `advance-subcheckpoint`.
- readiness sem próximo pendente projeta fechamento de checkpoint/Ready/Human Gate.
- `advance-subcheckpoint` vira `not-applicable` no terminal e some do menu.
- Human Gate passa a explicar readiness, PR Draft, CI, reviews, tree e branch como
  bloqueios derivados.

Testes adicionados:

- `handoffFacts.test.ts`: readiness terminal gera `terminal-ready` e não
  `advance-subcheckpoint`.
- `workBrief.test.ts`: readiness terminal gera `prepare_close` e comando read-only
  para Human Gate.
- `advanceSubcheckpoint.test.ts`: terminal sem próximo explica que a decisão não
  se aplica e não promete ativar nada.
- `humanGate.test.ts`: sub-checkpoint ativo sem readiness bloqueia; último
  sub-checkpoint com readiness terminal fica disponível para Gate quando as demais
  precondições estão verdes.
- `advanceConsistency.test.ts`: menu de `decide` omite `advance-subcheckpoint` no
  terminal e `work` concorda com Human Gate, não advance.

## Guard do Cutover

O guard arquitetural foi reforçado em `09d8db8`:

- `src/test-utils/CliRuntimeCollapse.test.ts` falha se `/cli` existir, se
  `package.json` reintroduzir `cli`, se scripts/test globs apontarem para `cli/`,
  se fontes importarem o runtime legado, se `LegacyExecuteFn`/`loadLegacyExecute`
  reaparecerem, ou se `providers` voltar ao registry/help.
- `tests/smoke/bin-shim.test.mjs` agora usa o metadata de `npm pack --json` e
  falha se o tarball publicar `cli/`, exigindo `dist/cli/main.js`.

O guard não proíbe a palavra `cli` em `src/cli`, `dist/cli`, docs históricas ou
comentários de proveniência.

## Validação Local

Executado em 2026-06-16:

```bash
git diff --check
npm run format
npm run build
npm run test:ts
npm run validate
npm run test:smoke
```

Resultados:

- `build`: verde.
- `test:ts`: 179 suites, 1949 testes, todos verdes.
- `validate`: verde; `insights:check` manteve advisory não bloqueante sobre
  PIT-0011 acumulado.
- `test:smoke`: 4 suites, 5 testes, todos verdes; inclui bin shim, init vazio,
  adopt existente, update managed-block e tarball sem `cli/`.

Comandos ativos via `npm run guidelines`:

- `--help`: lista `update --providers claude,openai` e não lista `providers`.
- `init --dry-run --target <tmp-empty> --name tmp-init --package-manager npm --providers claude`: exit 0.
- `adopt --dry-run --target <tmp-adopt> --name tmp-adopt --package-manager npm --providers claude`: exit 0.
- `update --providers claude,openai --dry-run --target <tmp-existing>`: exit 0.
- `providers --target <tmp-existing>`: exit 1, orienta `guidelines update --providers`.
- `check-budget`: exit 0.

## Tarball

Executado:

```bash
npm pack --dry-run
npm pack --json
tar -tf ai-guidelines-1.1.0.tgz
tar -xOf ai-guidelines-1.1.0.tgz package/package.json
```

Resultado explícito:

- `package/cli`: 0 entradas.
- `package/dist/cli/main.js`: presente.
- `package/package.json#bin`: `dist/cli/main.js`.
- `package/package.json#files`: não contém `cli`.
- `package/package.json#imports`: não aponta para `./cli/`.

## Consumidores Temporários

Consumidor novo:

- O runner instalou o tarball com `npm install <tgz>`.
- Observação operacional: `npm install <tgz>` materializa `package.json` no runner;
  por isso o caso "target realmente vazio" foi validado em subdiretório vazio sem
  `package.json`.
- `npx ai-guidelines --help`: exit 0.
- `npx ai-guidelines init --dry-run --target <empty-target> --name tmp-consumer-new --package-manager npm --providers claude`: exit 0.
- `npx ai-guidelines init --dry-run --target . ...` com `package.json`: exit 1,
  conflito esperado em `package.json`.
- `npx ai-guidelines init --dry-run --force --target . ...`: exit 0.

Consumidor existente:

- `npm init -y` + `npm install <tgz>`.
- `npx ai-guidelines adopt --dry-run --target . --name tmp-consumer-existing --package-manager npm --providers claude`: exit 0.
- `npx ai-guidelines update --providers claude,openai --dry-run --target .`: exit 0.
- `npx ai-guidelines providers --target .`: exit 1, orienta `guidelines update --providers`.

## CI Remoto

Após push para `09d8db8`, checks remotos do PR #42 ficaram verdes:

- `governance-pr-check`
- `repo-validation`
- `validate-os (ubuntu-latest)`
- `validate-os (windows-latest)`
- `smoke`
- smoke multi-OS/multi-Node: Ubuntu, Windows e macOS em Node 22.x e 24.x

## Riscos Residuais

- PR #42 permanece Draft; Ready e Human Gate continuam decisões humanas.
- A Spec 0024 não termina neste PR; CO-3.5 fecha apenas o último sub-checkpoint
  interno do nó `co-enforcement`.
- A próxima validação governada deve confirmar o estado terminal após o marcador
  `readiness: ready-for-transition` em `tasks.md`.
