# Governance Demo E2E

Esta pasta contem os testes de experiencia da `governance-demo`.

Eles rodam contra:

- Next app em `GOVERNANCE_DATA_SOURCE=mock-api`;
- `mock-api` com seeds resetaveis;
- Playwright como runner E2E.

Governanca real continua sendo provada por backend/checks especificos. Estes
testes provam que a pessoa consegue usar o produto sem console tecnico e que as
telas continuam consistentes entre si.

Camadas rapidas FORA do e2e (preferidas quando nao precisam de browser; ver
`TESTING-STRATEGY.md`):

- `backend/tests/*.test.ts` (`node --test`, via `acme-governance-backend run
test:shell`): authority (matriz papel x comando), invariantes de seed,
  **regressao das seeds** (`seed-coverage.test.ts`, migrada do Playwright) e
  read-model/rollup/grafo derivado.
- `mock-api/tests/*.test.ts` (`acme-governance-mock-api run test:api`): handler
  `/api/shell/commands` via Hono `app.request()` sem servidor.
- Ambas entram no check oficial `tools/checks/check-governance-app.ts`.

Regra de nivel: se uma regra pode ser provada por dominio + estado, ela NAO deve
virar teste Playwright. O e2e fica para jornada humana, cross-screen e a casca de
rota (sessao/gate) que so o handler real prova.

Sobre seeds: toda seed exposta pela mock-api precisa estar no `seed_matrix` e na
regressao de dominio. Uma seed pode ainda aparecer no aviso do `contracts:check`
como "sem contrato funcional de produto"; isso quer dizer apenas que ela ainda nao
guia uma jornada/tela/fluxo, nao que esteja sem cobertura tecnica.

## Comandos

```bash
npm --workspace acme-governance-e2e run typecheck
npm --workspace acme-governance-e2e run test:e2e
npm --workspace acme-governance-e2e run test:e2e:ui
npm --workspace acme-governance-e2e run test:e2e:report
```

## Estrutura

```text
test/
  contracts/
    app-contracts.yml        # contrato humano governado
  journeys/
    auth-workspace.spec.ts
    onboarding.spec.ts
    settings.spec.ts
    sources.spec.ts
    integrations.spec.ts
    cup.spec.ts
    planning-intake.spec.ts
    triage-gate.spec.ts
    work-contracts.spec.ts
    results-audit.spec.ts
    cross-screen-consistency.spec.ts
    security-authority.spec.ts
  playwright.config.ts
```

## Estados de teste

- `active`: roda e deve passar.
- `fixme`: contrato existe, mas a tela/fluxo ainda nao esta pronto.
- `expected-fail`: rota/seed/sessao ja chegaram; o comportamento positivo ainda deve falhar.
- `skip`: apenas para configuracao nao aplicavel.

`expected-fail` precisa de sentinela antes de `test.fail`: use `openWorkspace(...)`
ou `armExpectedFailAfterArrival(...)`. Contrato de bloqueio/deny nunca usa
`expected-fail`; fica `fixme` ate a superficie existir e depois vira `active`.

## Regra de manutencao

Se um fluxo mudar, atualize primeiro:

1. `contracts/app-contracts.yml`;
2. o `.spec.ts` correspondente;
3. `APP-ITERATION-MAP.md`.

So depois altere a implementacao.
