# `_org-simulation-v2` — simulação do modelo de trabalho (grafo de governança)

> Laboratório **FILE-FIRST** que materializa, ponta a ponta, o modelo de trabalho da Spec 0024 (o "grafo de
> governança") numa org fictícia e **anonimizada** (`acme-*`). **Não é o produto** — é onde o modelo é
> construído, validado e visualizado, **uma peça por vez**, confirmando/ajustando os templates conforme a
> necessidade aparece.
>
> O modelo canônico (as **5 lentes**, decisões 🔴 abertas / 🟢 fechadas) vive no **tracker**:
> [`tracker.md`](../tracker.md). **Esta simulação reflete o
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
    domain/{model,derive}.ts · ports.ts · backend.ts · build.ts · seed.ts · freshness.ts · scaffold.ts
    adapters/{file,sqlite,neo4j,mongo}/ · check.ts/neo4j-check.ts/mongo-check.ts (smokes)
  _viewer/                  ← a VIEW (Vite/React/TS): src/dashboard/ + render-dashboards.tsx
  acme-governance/          ← META-REPO da governança (HOST·back): src/ · intents/ · proposals.yml · .gitignore · README · package.json
  <repo-de-trabalho>/       ← PADRÃO de cada repo (front OU back):
    src/                    ←   o PRODUTO (index.html+main.js p/ front · index.js p/ back) — mínimo na sim
    .governance/            ←   a GOVERNANÇA (sidecar, fora do código):
      manifest.yml          ←     a face EXTERNA — o host DESCOBRE o repo por aqui
      registry/<kind>.yml   ←     índices dos works/explorations
      works/ · explorations/←     o conteúdo (briefs/q-r-d/answers)
      context.json          ←     a projeção PUBLICADA (VERSIONADA — é o contrato)
      .cache/               ←     read-models (db.json/dashboard.html) — gitignored
      backend.yml           ←     o banco do repo (ausente = file; sqlite/neo4j/mongo)
    .gitignore · README.md · package.json
  acme-design-system/[file] · acme-mfe-identity/[sqlite] · acme-mfe-support/[neo4j]+docker-compose.yml
  _archive/                 ← simulações antigas + o _banks legado (referência)
```

> **Criar um repo novo (o padrão, via script):** `node _lib/scaffold.ts <nome> <front|back> ["papel"] [file|sqlite|neo4j|mongo]`
> → gera o padrão completo (`src/` + `.governance/` + `.gitignore` + `README` + `package.json`); o host
> **auto-descobre** (basta ter `.governance/registry/`).
>
> **VERSIONADO** (a fonte + o contrato): o `.governance/` source (`registry`/`works`/`explorations`/`manifest`) + o
> **`context.json`** (projeção publicada; freshness no pre-commit). **Gitignored** (caches regeneráveis): o
> `.governance/.cache/` (`db.json`/`dashboard.html`) · `*.db` (sqlite) · `node_modules/`. **Cada repo tem o seu
> `.gitignore` + `README`** (este README da raiz é a visão geral).

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

### 6.9 Roteamento — matcher léxico (solo) ou LLM local

O grafo VERTICAL (sugere ONDE investigar / QUEM entrega) usa um **`Matcher` plugável** — **léxico** (default, zero infra) · **LLM LOCAL** (Ollama, soberania) · **hosted via PLANO** (Claude/OpenAI, sem tokens) **ou API** (Gemini). O espectro solo→enterprise, o `matcher.yml`, como rodar cada tier e as **tabelas medidas**: **[`MATCHER.md`](MATCHER.md)**. Dogfood: `node _lib/routing-check.ts` · stress: `node _bench/stress-bench.ts`.

---

## 7 · Estado atual + próximos passos

- ✅ **Modelo (Lentes 1–5) fechado** no tracker. Decisões recentes: **a intent NÃO delibera** (q/r/d é etapa de work/exploration; o gate deriva do breakdown — `derives-from`) · **manifesto-por-repo** (auto-discovery + arestas cross-repo derivadas de `provides×consumes`) · **host agrega projeções PUBLICADAS** (`build` em 2 fases; `context.json` versionado + freshness no pre-commit).
- ✅ **A lib DDD pronta:** domínio + portas + adapters **file/sqlite/neo4j/mongo** (a porta validada em 4 paradigmas; `explores` carrega nos 4) + runner + view.
- ✅ **Padrão de repo + scaffold:** `src/` (produto) + `.governance/` (sidecar) + `dev`/`.gitignore`/`README` por repo; criar novo via `node _lib/scaffold.ts`. Os **3 explore-points resolvem** no dashboard (e1/e2 aceitos · e3 rejeitado; e2 fecha **offline** pela projeção publicada do `support`).
- ✅ **Checks + roteamento (COMPLETO, medido):** os **2 checks do manifesto** (anti-typo · freshness do `architecture`) e o **roteamento vertical v1+v2** — porta `Matcher` async plugável (léxico → embed local → LLM local → **hosted via plano/API**), `deriveRouting`/`deriveTagGraph`, build resiliente, **bench + stress test** ([`MATCHER.md`](MATCHER.md): no difícil o barato colapsa e o LLM ganha; **maior ≠ melhor**; Claude/OpenAI via plano = 8/8 **sem tokens**).
- ▶ **Fila:** a **rodada do `_viewer`** (fiar o app vivo à lib + a viz de roteamento/tag-graph) · `Neo4jHostRepository` + arestas da Lente 3 como relações no Neo4j · revisitar a **D3** (arestas). 🅿️ parqueado: **gerador de capabilities** · Q5 (gate de evolução).

**O ponto-a-ponto de retomada é o bloco "✅ ESTADO ATUAL" no topo da retomada do tracker** (supersede a retomada histórica).

---

## 8 · Convenções

- **Anonimização:** só `acme-*`; nunca empresa real, URLs internas ou nomes de plataforma. Docs externos **inspiram, não se versionam/citam**.
- **Ids:** `<slug>_<num>` (ex. `form-component_1`) — sem prefixo de tipo (o tipo vem da pasta/registry). Refs cross-repo = o caminho `<repo>/<tipo>/<id>`.
- **Gerados ≠ fonte:** `db.json`/`dashboard.html`/`*.db` são read-models derivados (gitignored). A fonte é o `.governance/` (file) ou o banco (sqlite/neo4j/mongo).
- **Commits incrementais**, nunca `--no-verify`.
- **Rename é livre na simulação:** reestruturar/renomear aqui custa **0** — o custo de rename só existe rodando de verdade. É um valor de simular: erra-se nome/forma à vontade antes de cravar (a sim flexiona do dev-solo à grande empresa).
- **A intent NÃO delibera:** q/r/d é etapa de **work**/**exploration**; a intent usa a ferramenta `exploration` (que `explores` um subject → `verdict`) e o **gate deriva do breakdown** (uma work `derives-from` a exploration = aceito; nenhuma = rejeitado). Sem `deliberation.yml` na intent.
