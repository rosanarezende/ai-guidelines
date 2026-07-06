# Shared portal Postgres compose

This compose profile is the low-friction path for testing the shared portal
with a real PostgreSQL database.

It is intentionally small:

- it starts **PostgreSQL only**;
- it does not package the Next app yet;
- it does not decide the final hosting provider;
- it does not replace the governance host or Git-backed SSOT;
- it is not needed for `local-solo` SQLite usage.

## When to use it

Use this when you need to test a multi-user portal path:

- account creation;
- workspace registry;
- invite and accept;
- multiple people seeing the same workspace;
- PostgreSQL persistence instead of SQLite/local file state.

Do **not** use it just to try the solo/local app. SQLite does not need Docker.

## Start Postgres

From this directory:

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
docker compose ps
```

The default local connection string is:

```text
postgres://governance:change-me-local@127.0.0.1:55432/governance_portal
```

## Run the portal spike against Postgres

From the repository root:

```powershell
$env:GOVERNANCE_PORTAL_POSTGRES_URL = "postgres://governance:change-me-local@127.0.0.1:55432/governance_portal"
$env:GOVERNANCE_PORTAL_POSTGRES_SPIKE_APPLY = "1"
npm --workspace .governance/specs/0024-context-architecture/work-graph-model/governance-demo/backend run test:shell
```

Expected result: the S1f test runs against live Postgres instead of returning a
`skipped-*` report.

## Stop or reset

Stop the container and keep the database volume:

```powershell
docker compose down
```

Delete the database volume too:

```powershell
docker compose down -v
```

## Security boundary

The default password is deliberately local and weak. Change it for any shared
environment. Do not commit `.env` files with real secrets.

This compose file is a development and dogfood tool. A production deployment
still needs explicit decisions about domain, TLS, backups, e-mail, logs,
identity provider, operator responsibility and cost.
