# Mock API da governance-demo

> **Regra de produto (QRD-05/07):** a mock API valida **experiência**, não governança.
> Jornada que passa aqui conta como `UX-provada`; governança real só é provada pelo
> backend real (command runtime/resolvers). Em produção, `mock-api` é proibida.

## O que é

Servidor HTTP local (Hono + lowdb + TypeScript, roda `.ts` nativo no Node ≥ 22.18) que
persiste o estado do shell de adoção em JSON mutável (`.data/db.json`, gitignored) para
iterar UX e rodar e2e sem depender do runtime governado.

**Fidelidade por construção:** as mutações passam pelo MESMO reducer puro do domínio
(`@demo/domain`, arquivo físico `packages/domain/src/onboarding/adoption-commands.ts`) que o
backend real usa. As seeds vêm de `@demo/test-fixtures`. A mock API não tem regra
própria — ela só troca a persistência (lowdb em vez de file-first + lock).

## Contrato de API

| Método | Rota                  | O que faz                                                                                                                               |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`             | `{ ok, service, seed }`                                                                                                                 |
| GET    | `/api/shell/state`    | `AdoptionState` completo (mesmo schema `governance.local-adoption/v1`)                                                                  |
| POST   | `/api/shell/commands` | `{ command: LocalShellCommand }` → `{ ok, state }` ou `{ ok:false, error }` (422); duplicata de `command.id` é rejeitada (idempotência) |
| GET    | `/__seeds`            | nomes das seeds disponíveis                                                                                                             |
| POST   | `/__reset`            | `{ seed? }` recarrega a seed (default `blank`)                                                                                          |

O frontend NÃO chama estas rotas diretamente: em `GOVERNANCE_DATA_SOURCE=mock-api`, a
porta de store do shell (`frontend/server/adoption/infrastructure/store.ts`) despacha os
comandos para cá — as rotas de produto `/api/local/*` do Next continuam as mesmas.

> Nota: a QRD-03 sugeria rotas REST por recurso (accounts/workspaces/...). A implementação
> usa o contrato de COMANDOS compartilhado com o backend real — desvio deliberado que
> elimina drift de regra entre mock e real (uma única transição de estado no domínio).

## Seeds (26)

`blank` (default e2e) · `empty-workspace` · `onboarding-partial` · `acme-demo` ·
`workspace-sem-host` · `workspace-host-local` · `workspace-host-embutido` ·
`workspace-local` · `workspace-shared` · `workspace-controlled` ·
`workspace-controlled-neo4j` · `workspace-docker-compose` ·
`workspace-docker-ollama-profile` · `workspace-groups-teams` ·
`workspace-authority-personas` · `workspace-shared-convites` ·
`workspace-shared-github` · `workspace-shared-google` ·
`workspace-controlled-oidc` · `workspace-cloud-synced-folder` ·
`workspace-provider-versioned-source` · `workspace-compact-policy` ·
`workspace-multi-assistant` · `workspace-with-integration-statuses` ·
`workspace-planning-progressivo` · `workspace-github-work-source`

Todas construídas com os builders/tipos do domínio real (type-checked) e nomes `acme-*`.

## Como rodar

```bash
# na raiz do repositório
npm --workspace acme-governance-mock-api run dev          # mock-api:dev (porta 3025)
npm --workspace acme-governance-mock-api run reset        # mock-api:reset (seed blank)
npm --workspace acme-governance-mock-api run reset -- workspace-shared-convites

npm --workspace acme-governance-next-app run dev:mock     # mock-api + app Next em modo mock
npm --workspace acme-governance-next-app run dev:real     # app Next em modo real (file-first)
npm --workspace acme-governance-e2e run test:e2e          # Playwright contra mock seedada
```

Variáveis (QRD-01): `GOVERNANCE_DATA_SOURCE=real-runtime|mock-api|demo-acme`,
`GOVERNANCE_API_BASE_URL` (default `http://127.0.0.1:3025`), `GOVERNANCE_APP_ENV`.
