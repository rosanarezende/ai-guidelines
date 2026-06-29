# Deliberação — o host agrega PROJEÇÕES PUBLICADAS (não bancos vivos) + context.json VERSIONADO — em q/r/d

- Data: 2026-06-29 · Spec 0024 · Natureza: **research/deliberação, não-autoridade** (insumo de DEC).
- O **embasamento detalhado** vive na research [`2026-06-29-governance-aggregates-published-projections.md`](2026-06-29-governance-aggregates-published-projections.md); aqui é a deliberação em q/r/d.
- Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git.

---

## Questions

### Q1 — pra desenvolver uma intent (multi-repo, multi-backend), preciso subir TODOS os bancos?

- (a) sim, o host abre o backend de cada repo · (b) não — o host agrega a **projeção publicada** de cada repo (camada EXTERNA), sem abrir banco.

### Q2 — a projeção publicada (`context.json`) é cache local (gitignored) ou versionada?

- (a) gitignored (como `db.json`) · (b) **versionada** (é o contrato).

### Q3 — onde moram os read-models derivados (`db.json`/`dashboard.html`/`governance.db`)?

- soltos no `.governance/` · numa pasta dedicada.

---

## Researches (referências — detalhe na research dedicada)

- **R1** (→Q1): software catalogs (Backstage) agregam **arquivos** (`catalog-info.yaml`) varridos por providers — **não rodam o banco de cada serviço**; padrão "context-data" (host agrega contextos publicados). É a Lente 5 (EXTERNA × INTERNA) / "banco→banco" do tracker.
- **R2** (→Q2): por que versionar (mesmo solo): git já é distribuição zero-infra; agrega **offline em qualquer clone** (sem subir banco); o diff é **AUDITORIA** (valor de governança); é o **padrão lock-file** (derivado, mas commitado + freshness-checado). O gitignored-cache só serve se você sempre tem os bancos no ar.
- **R3** (→Q1/Q2): **prova viva** na sim — com o **neo4j FORA**, o host agrega o `context.json` publicado do `support` → **e2 resolve offline** (3/3 projeções, sem abrir banco).

---

## Decisions (owner 2026-06-29)

### D1 (resolve Q1) — **host agrega projeções publicadas** (opção b) · build em 2 FASES

`build.ts`: **FASE 1 (publicar)** cada repo, com o SEU backend, deriva → `context.json`; **FASE 2 (agregar)** o host lê os `context.json` **sem abrir banco**. → desenvolver a intent **não exige subir os bancos** (cada repo publica 1x com o seu backend). Resiliente (backend fora = usa o `context.json` anterior).

### D2 (resolve Q2) — **`context.json` VERSIONADO** + freshness no pre-commit

É o contrato → commitado (já determinístico; `.prettierignore` evita ping-pong). **`_lib/freshness.ts`** (lint no lint-staged) regenera + compara → FALHA no drift → o repo continua a FONTE. **Solo = commitado no git** (+ hook); gitignored-cache **descartado**.

### D3 (resolve Q3) — caches → **`.governance/.cache/`** (gitignored)

`db.json`/`dashboard.html`/`governance.db` (sqlite) vão pro `.cache/` — escopo explícito: **source × contrato publicado (`context.json`) × cache (`.cache/`)**.

---

## Aplicado

`_lib/build.ts` (2 fases) · `freshness.ts` · `SqliteRepository` (.db → .cache) · `.gitignore`/`.prettierignore` · render. Commits `f864eedf` (2 fases) · `fbfed47d` (versionado+freshness+.cache) · `949ae785` (.db→.cache) · `5cb34df0` (support publica → e2 offline). Detalhe no tracker.
