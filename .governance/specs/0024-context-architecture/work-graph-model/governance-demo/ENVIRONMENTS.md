# Governance demo environments

> Status: active.
> Scope: development, test and production-like operation of `governance-demo`.

This document keeps the app modes explicit. The goal is to avoid three common
confusions:

- using the mock API as if it were governance;
- requiring Docker for the solo/local path;
- treating the shared Postgres compose as the final hosting decision.

## 1. Environment modes

| Mode                       | Env values                                                                                  | Main command                                                                  | Persistence                                              | Intended use                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `development:real-runtime` | `GOVERNANCE_APP_ENV=development`, `GOVERNANCE_DATA_SOURCE=real-runtime` or unset            | `npm --workspace acme-governance-next-app run dev:real`                       | `frontend/.local-state/` or `GOVERNANCE_LOCAL_STATE_DIR` | Day-to-day local app using the real file-first shell.                     |
| `development:mock-api`     | `GOVERNANCE_APP_ENV=development`, `GOVERNANCE_DATA_SOURCE=mock-api`                         | `npm --workspace acme-governance-next-app run dev:mock`                       | `mock-api/.data/db.json`                                 | UX iteration with resettable seeds; validates experience, not governance. |
| `development:shared-db`    | Same as real or spike env plus `GOVERNANCE_PORTAL_POSTGRES_URL` and explicit apply flag     | `docker compose up -d postgres` in `deploy/shared-portal/`, then `test:shell` | Docker volume `governance-portal-postgres-data`          | Dogfood of shared portal account/workspace/invite on live PostgreSQL.     |
| `test:e2e`                 | `GOVERNANCE_APP_ENV=test`, `GOVERNANCE_DATA_SOURCE=mock-api`, `GOVERNANCE_API_BASE_URL=...` | `npm --workspace acme-governance-e2e run test:e2e`                            | Playwright-managed mock API state, reset by seed         | Browser journeys, route gates and cross-screen product contracts.         |
| `test:domain-api`          | Node test process env                                                                       | `test:shell`, `test:api`, `check-governance-app.ts`                           | Temporary dirs or in-memory Hono request where possible  | Fast invariants: authority, seeds, read-model, schema and replay.         |
| `production-like`          | `NODE_ENV=production` or `GOVERNANCE_APP_ENV=production`; `mock-api` is forbidden           | `npm --workspace acme-governance-next-app run build` then `start`             | Operator-chosen real store; never `mock-api`             | Smoke of production build/runtime boundaries, not final hosting.          |

## 2. Data-source contract

The app has one server-side switch:

```text
GOVERNANCE_DATA_SOURCE=real-runtime | mock-api | demo-acme
```

Rules:

- default is `real-runtime`;
- `mock-api` is allowed only in development/test and fails closed in production;
- `demo-acme` is read-mostly and blocks configuration mutations;
- source selection never comes from browser storage;
- `GOVERNANCE_API_BASE_URL` is used only when `GOVERNANCE_DATA_SOURCE=mock-api`.

## 2.1 Portal auth contract

Better Auth is mounted in the Next app at `/api/auth/[...all]`.

The product login is passwordless. The app does **not** collect or store
end-user passwords. Supported entry methods are:

- magic link by e-mail;
- GitHub provider when configured;
- Google provider when configured;
- anonymous demo, which creates only a local sandbox session and no portal
  account.

Local/default persistence:

```text
GOVERNANCE_PORTAL_SQLITE_PATH=<optional absolute path>
```

If unset, the portal auth database lives beside the local adoption shell in
`frontend/.local-state/portal-auth.sqlite` (or under `GOVERNANCE_LOCAL_STATE_DIR`
when that override is set).

Production-like runtime must provide:

```text
BETTER_AUTH_SECRET=<strong secret>
BETTER_AUTH_URL=<public app url ending in /api/auth>
```

Without `BETTER_AUTH_SECRET`, the auth route fails closed in production. Local
development uses a fixed non-production secret only to keep the demo bootable.

Magic link delivery:

```text
GOVERNANCE_AUTH_MAGIC_LINK_WEBHOOK_URL=<optional HTTPS endpoint>
GOVERNANCE_AUTH_MAGIC_LINK_WEBHOOK_TOKEN=<optional bearer token>
GOVERNANCE_AUTH_MAGIC_LINK_DELIVERY=dev-outbox
```

Rules:

- when `GOVERNANCE_AUTH_MAGIC_LINK_WEBHOOK_URL` is set, the app POSTs the link
  to that endpoint;
- in development/test, or when `GOVERNANCE_AUTH_MAGIC_LINK_DELIVERY=dev-outbox`,
  links are appended to `portal-magic-links.jsonl` under the local state
  directory for automated tests and local dogfood;
- in production-like runtime, magic link delivery fails closed unless a webhook
  or approved e-mail adapter is configured.

Social provider credentials:

```text
GOVERNANCE_AUTH_GITHUB_CLIENT_ID=<optional>
GOVERNANCE_AUTH_GITHUB_CLIENT_SECRET=<optional>
GOVERNANCE_AUTH_GOOGLE_CLIENT_ID=<optional>
GOVERNANCE_AUTH_GOOGLE_CLIENT_SECRET=<optional>
```

Provider login identifies the person in the portal. It does not connect GitHub
repositories, Google Drive, Gmail or Calendar, and it does not grant governance
authority.

## 3. Docker contract

SQLite/local-solo does **not** need Docker.

Docker Compose is provided only for the shared portal PostgreSQL dogfood path:

```powershell
cd .governance/specs/0024-context-architecture/work-graph-model/governance-demo/deploy/shared-portal
Copy-Item .env.example .env
docker compose up -d postgres
```

That compose profile starts PostgreSQL only. It does not package the Next app,
does not start Neo4j, does not decide the hosting provider and does not replace
the governance host/Git-backed SSOT.

## 4. Scripts by workspace

### Frontend (`acme-governance-next-app`)

| Script     | Purpose                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `dev`      | Plain Next dev server; defaults to `real-runtime`.                      |
| `dev:real` | Explicit real-runtime dev server.                                       |
| `dev:mock` | Cross-platform helper that starts mock-api in-process and Next in mock. |
| `build`    | Production build.                                                       |
| `start`    | Production-like Next start.                                             |

### Backend (`acme-governance-backend`)

| Script       | Purpose                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `typecheck`  | Strict TypeScript check for runtime/backend source and tests.                |
| `test:shell` | Fast node:test suite: domain, authority, seed, read-model and portal spikes. |

### Mock API (`acme-governance-mock-api`)

| Script      | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `dev`       | Starts the Hono/lowdb mock API on `127.0.0.1:3025`.              |
| `reset`     | Resets the mock API to a seed.                                   |
| `typecheck` | Strict TypeScript check.                                         |
| `test:api`  | In-memory Hono `app.request()` tests: schema, replay, authority. |

### E2E (`acme-governance-e2e`)

| Script            | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `contracts:check` | Lints `test/contracts/app-contracts.yml`.                                |
| `typecheck`       | Typechecks Playwright specs/helpers.                                     |
| `test:e2e`        | Runs the full browser journey suite against mock-api + Next in test env. |
| `test:e2e:ui`     | Playwright UI mode.                                                      |
| `test:e2e:report` | Opens the generated HTML report.                                         |

## 5. Production guardrails

- `GOVERNANCE_DATA_SOURCE=mock-api` is prohibited when the resolved app env is
  production.
- The shared portal compose uses a development password and must not be used as
  an unattended production credential.
- Real production still needs explicit decisions about domain, TLS, backup,
  e-mail, logs, identity provider, operator responsibility and cost.
- Governance content remains in the governance host/Git-backed SSOT. The portal
  database stores account/workspace/invite registry data only.
