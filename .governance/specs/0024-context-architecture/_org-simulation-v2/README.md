# `_org-simulation-v2` — simulação do modelo de trabalho (grafo de governança)

> Laboratório **FILE-FIRST** que materializa, ponta a ponta, o modelo de trabalho da Spec 0024 (o "grafo de
> governança") numa org fictícia e **anonimizada** (`acme-*`). **Não é o produto** — é onde o modelo é
> construído, validado e visualizado, **uma peça por vez**, confirmando/ajustando os templates conforme a
> necessidade aparece.
>
> O modelo canônico (as **5 lentes**, decisões 🔴 abertas / 🟢 fechadas) vive no **tracker**:
> [`research/2026-06-25-work-graph-model.md`](../research/2026-06-25-work-graph-model.md). **Esta simulação reflete o
> tracker** — em divergência, o tracker vence.

---

## 1 · O que é (e por que existe)

O objetivo é modelar **o fluxo de governança inteiro** como um **grafo tipado** e provar que ele _roda_:

```
intent (objetivo) → exploration (investiga) → decision (o gate) → breakdown (cria os works)
                 → deliberação do work (q/r/d) → execução → fecho → a intent progride
```

Princípios da simulação:

- **File-first:** a fonte da verdade são **arquivos** (`.governance/` em cada repo). O banco e a view são **projeções derivadas** (read-models), não a fonte.
- **Anonimizado:** tudo é `acme-*` (org/repos fictícios). **Nunca** versionar nome/URLs/docs de empresa real.
- **Templates primeiro:** modela-se nos `_templates/` (a casa canônica) e nos arquivos; o app **reflete** depois.
- **Backend plugável (Lente 5):** o mesmo modelo roda do **dev solo** (arquivos) até **bancos reais** (SQLite, Neo4j, Mongo) — sem mudar o domínio.

---

## 2 · O modelo, em 1 minuto

| conceito         | o que é                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **intent**       | o objetivo durável (multi-repo). Mora na governança. Quebra em N works (`breaks-into`, derivado).                                                      |
| **work**         | os 5 tipos de TRABALHO (`delivery`·`experiment`·`incident`·`fix`·`patch`). Entrega valor de produto.                                                   |
| **exploration**  | ferramenta: investiga e **responde** uma question (`answers`).                                                                                         |
| **proposal**     | ferramenta: intake (ideia/problema). Mora na governança.                                                                                               |
| **q/r/d**        | `question` → `research` → `decision` (o coração). O **gate**: respondida (tem research) **≠** resolvida (decisão aceita).                              |
| **as 2 camadas** | **INTERNA** = a deliberação + o state do repo (decisões + impacto no código) · **EXTERNA** = o que o repo publica pra governança agregar (as arestas). |

Detalhe completo (as 10 arestas da Lente 3, o ciclo de vida, etc.): **no tracker**.

---

## 3 · Arquitetura (DDD: domínio puro + portas + adapters)

```
        ┌──────────────── _lib/ (a biblioteca compartilhada) ────────────────┐
        │                                                                     │
        │  domain/  (PURO — não conhece banco)                                │
        │    model.ts   entidades + arestas (Lente 3)                         │
        │    derive.ts  deriveDeliberation (gate/state) · deriveContext ·     │
        │               deriveGovernance (o host)                            │
        │                          ▲                                          │
        │  ports.ts  ── Repository (banco INTERNO do repo, read+write)        │
        │              └ HostRepository (governança: intents + proposal)      │
        │                          ▲  (async — Neo4j-ready)                   │
        │  adapters/   (SÓ AQUI o banco muda — implementam as portas)         │
        │    file/ · sqlite/ · neo4j/ · mongo/                                │
        │                          ▲                                          │
        │  backend.ts  escolhe o adapter por repo (lê <repo>/.governance/backend.yml) │
        │  build.ts    RUNNER: lê via portas → regenera os db.json read-models │
        │  seed.ts     migra .governance/ (arquivos) → o backend do repo      │
        └─────────────────────────────────────────────────────────────────────┘
                                   │ db.json (read-models, derivados)
                                   ▼
            _viewer/  (React) — componentes do dashboard (SSR p/ estático + app vivo)
```

**O ponto:** a porta `Repository` é **neutra** (CRUD: `list/get/save/add`). Toda a lógica vive no **domínio puro**. Trocar de banco = trocar o adapter; **domínio, derivações e view não mudam** — provado em 4 paradigmas (§5).

---

## 4 · Estrutura de pastas

```
_org-simulation-v2/
  _lib/                     ← a LIB (DDD) — o coração
    domain/{model,derive}.ts · ports.ts · backend.ts · build.ts · seed.ts
    adapters/{file,sqlite,neo4j,mongo}/
    check.ts · neo4j-check.ts · mongo-check.ts   ← smokes (provas)
    tsconfig.json · package.json
  _viewer/                  ← a VIEW (Vite/React/TS)
    src/dashboard/{Dashboards,types}.ts  + render-dashboards.tsx  (a view-lib + SSR)
    src/… (app VIVO antigo — autoria; pendente de fiar à lib nova)
  acme-governance/          ← META-REPO da governança (HOST)
    intents/login_1/{intent,deliberation}.yml · proposals.yml · package.json
  acme-design-system/       ← repo de trabalho   [backend: file]
    .governance/{registry/, works/delivery/form-component_1/{questions/,research/,deliberation.yml}, explorations/}
    package.json
  acme-mfe-identity/        ← repo de trabalho   [backend: sqlite]
    .governance/{registry/, backend.yml(kind: sqlite)} · package.json
  acme-mfe-support/         ← repo de trabalho   [backend: neo4j]
    .governance/{registry/, explorations/, backend.yml(kind: neo4j)} · docker-compose.yml · package.json
  _archive/                 ← simulações antigas (referência)
```

> **Gerados (gitignored):** `**/dashboard.html` · `**/.governance/db.json` · `**/.governance/*.db` (SQLite) · `_writecheck/`. Regeneram com `build` / `dashboards`.

---

## 5 · Os backends plugáveis (4 paradigmas — validados)

Cada repo **declara** seu backend num `<repo>/.governance/backend.yml`. Ausente = `file`.

| backend    | paradigma  | guarda como                   | infra                              | repo que usa                     |
| ---------- | ---------- | ----------------------------- | ---------------------------------- | -------------------------------- |
| **file**   | arquivos   | pastas + yaml/md              | nenhuma                            | `acme-design-system`             |
| **sqlite** | relacional | tabelas (listas → JSON)       | nenhuma (`node:sqlite`, embarcado) | `acme-mfe-identity`              |
| **neo4j**  | grafo      | nós (+ relações = futuro)     | Docker                             | `acme-mfe-support`               |
| **mongo**  | documento  | docs (arrays/objetos nativos) | Docker                             | smoke (qualquer repo pode optar) |

```yaml
# exemplo: acme-mfe-support/.governance/backend.yml
kind: neo4j
uri: bolt://localhost:7687
user: neo4j
password: simsim123 # DEV/sim apenas
```

---

## 6 · Como rodar

### 6.1 Pré-requisitos

- **Node 22+** (usa `node --experimental` nada; type-stripping nativo + `node:sqlite`). Aqui via **fnm**.
- **Docker Desktop** — só para os backends de servidor (Neo4j, Mongo). File/SQLite não precisam.
- Dependências da lib/viewer já instaladas (`npm install` em `_lib/` e `_viewer/` se faltar).

### 6.2 O fluxo básico (file + sqlite — zero infra)

```bash
cd _lib && node build.ts          # lê cada repo (do seu backend) → regenera os db.json read-models
cd ../_viewer && npm run dashboards  # React (SSR) → dashboard.html por repo + o principal
```

Abra os `dashboard.html` gerados (em cada `<repo>/.governance/` e em `acme-governance/`). O `build` é **resiliente**: se um backend de servidor está fora, ele **pula** aquele repo (avisa) e segue.

### 6.3 Cada repo roda o SEU (os `package.json`)

De dentro de um repo (`cd acme-mfe-identity`):

```bash
npm run seed        # migra o .governance/ → o backend do repo (noop se file)
npm run build       # regenera os read-models
npm run dashboard   # build + render dos dashboards (chama o _viewer)
```

### 6.4 Backend Neo4j (`acme-mfe-support`) — banco de grafos, persistente

```bash
cd acme-mfe-support
npm run db:up       # docker compose up -d --wait  (Neo4j com VOLUME → dados PERSISTEM)
npm run seed        # 1ª vez: .governance/ → Neo4j
npm run dashboard   # build + dashboards (o do support vem do GRAFO)
# ver o grafo:  http://localhost:7474   (neo4j / simsim123)
npm run db:down     # para, MANTENDO os dados   ·   npm run db:nuke = apaga os dados (volume)
```

### 6.5 Backend Mongo (documento — prova por smoke)

```bash
docker run -d --name mongo-sim -p 27017:27017 mongo:7
cd _lib && node mongo-check.ts    # seed do design-system → Mongo → lê pela mesma porta → deriva
docker rm -f mongo-sim            # limpa (era smoke)
```

### 6.6 Smokes (as provas da pluggability)

```bash
cd _lib
node check.ts        # FileRepository: read no repo real + write num repo temp + derive
node neo4j-check.ts  # Neo4jRepository: seed + lê pela mesma porta (precisa do Neo4j no ar)
node mongo-check.ts  # MongoRepository: idem, no Mongo
```

### 6.7 Typecheck

```bash
cd _viewer
npx tsc -p ../_lib/tsconfig.json   # a lib (strict)
npx tsc --noEmit                   # a view
```

### 6.8 O app VIVO antigo (legado)

`cd _viewer && npm run dev` sobe a app antiga de **autoria** (json-server + db central). Ela ainda está no **modelo antigo** e **pendente** de ser fiada à lib nova — use os dashboards estáticos (§6.2) como a view atual.

---

## 7 · Estado atual + próximos passos

- ✅ **Modelo (Lentes 1–5) fechado** no tracker; deliberação q/r/d simulada via templates.
- ✅ **A lib DDD pronta:** domínio + portas + adapters **file/sqlite/neo4j/mongo** (a porta validada em 4 paradigmas) + runner + view.
- ▶ **Retomar a simulação:** as **decisions** do `form-component_1` (o gate evoluindo — `d1/d2/d3`, com `d3` reabrindo q2). Cenário no tracker (seção "Plano de simulação").
- 🔵 **Refinamentos do grafo:** as **arestas da Lente 3 como relações** no Neo4j (hoje nós-only) · `Neo4jHostRepository`.

Detalhe e ponto-a-ponto de retomada: **no tracker** (seção "Próximo / retomar AQUI").

---

## 8 · Convenções

- **Anonimização:** só `acme-*`; nunca empresa real, URLs internas ou nomes de plataforma. Docs externos **inspiram, não se versionam/citam**.
- **Ids:** `<slug>_<num>` (ex. `form-component_1`) — sem prefixo de tipo (o tipo vem da pasta/registry). Refs cross-repo = o caminho `<repo>/<tipo>/<id>`.
- **Gerados ≠ fonte:** `db.json`/`dashboard.html`/`*.db` são read-models derivados (gitignored). A fonte é o `.governance/` (file) ou o banco (sqlite/neo4j/mongo).
- **Commits incrementais**, nunca `--no-verify`.
