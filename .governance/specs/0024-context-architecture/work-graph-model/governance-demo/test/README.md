# Governance Demo E2E

Esta pasta contem os testes de experiencia da `governance-demo`.

Eles rodam contra:

- Next app em `GOVERNANCE_DATA_SOURCE=mock-api`;
- `mock-api` com seeds resetaveis;
- Playwright como runner E2E.

Governanca real continua sendo provada por backend/checks especificos. Estes
testes provam que a pessoa consegue usar o produto sem console tecnico e que as
telas continuam consistentes entre si.

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
