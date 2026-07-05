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
    onboarding-journey.spec.ts
    first-wave-contracts.spec.ts
  playwright.config.ts
```

## Estados de teste

- `active`: roda e deve passar.
- `fixme`: contrato existe, mas a tela/fluxo ainda nao esta pronto.
- `expected-fail`: roda e deve falhar enquanto o bug/feature nao for corrigido.
- `skip`: apenas para configuracao nao aplicavel.

## Regra de manutencao

Se um fluxo mudar, atualize primeiro:

1. `contracts/app-contracts.yml`;
2. o `.spec.ts` correspondente;
3. `APP-ITERATION-MAP.md`.

So depois altere a implementacao.
