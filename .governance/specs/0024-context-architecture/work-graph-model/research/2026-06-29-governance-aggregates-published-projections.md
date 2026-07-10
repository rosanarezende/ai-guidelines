---
artifact-kind: pre-coding-review
subject: "governanca agregando projecoes publicadas em vez de bancos vivos"
date: 2026-06-29
disposition: evidence
---

# A governança agrega PROJEÇÕES PUBLICADAS, não bancos vivos (multi-repo, multi-backend)

- Data: 2026-06-29 · Spec 0024 · Natureza: **research, não-autoridade** (insumo de DEC; não decide sozinho).
- Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git.
- Continua [`2026-06-28-per-repo-self-contained-data-and-view.md`](2026-06-28-per-repo-self-contained-data-and-view.md) (backend plugável) e [`2026-06-29-cross-repo-comms-manifest-and-discovery.md`](2026-06-29-cross-repo-comms-manifest-and-discovery.md) (manifesto + auto-discovery). Prior art **pública** nas referências.

---

## 1 · O problema (pergunta da owner)

Um projeto tem **5–6 repos**, cada um podendo ter o **seu próprio backend** (file/sqlite/neo4j/mongo — backend
plugável, por-repo, via `.governance/backend.yml`). Cria-se uma **intent** que precisa que o **conhecimento se
comunique** entre os repos (o host de governança agrega o contexto de todos pra derivar o gate, o grafo cross-repo,
o breakdown). **Pergunta:** _pra desenvolver essa intent, é preciso subir TODOS esses bancos?_

Sintoma observado na sim: o `e2` (proactive-support) não resolvia porque a evidência mora no repo cujo backend é
**neo4j (fora)**. Ou seja: o host estava **abrindo o banco vivo de cada repo** pra agregar — então um banco fora
quebrava a agregação. **Isso não escala** pro dev (6 repos × docker) e acopla "desenvolver a governança" a "ter
todos os bancos no ar".

## 2 · A resposta: **NÃO** — separe INTERNO de EXTERNO (Lente 5)

O host **não deve ler os bancos vivos**. Ele agrega a **PROJEÇÃO PUBLICADA** de cada repo — a **camada EXTERNA**
da Lente 5. É o **"banco→banco"** que o tracker já prevê (o repo deriva local; a governança consome a projeção do
repo).

```
repo  (backend QUALQUER: file/sqlite/neo4j/mongo)
  │  PUBLICAR (usa o backend DELE, localmente) → deriva a projeção externa
  ▼
context.json   ← a camada EXTERNA: o que o repo publica (manifesto + answers + arestas + works publicados).
  │              UM arquivo PORTÁTIL, backend-agnóstico. É um CONTRATO (snapshot estável), não o banco.
  ▼
host de governança  →  AGREGAR: lê os context.json de TODOS os repos (NÃO abre banco nenhum)
                       → deriva intent/gate, grafo cross-repo, breakdown
```

- **INTERNO** = o banco do repo (neo4j etc.), onde os works/q-r-d/explorations vivem. **Problema do repo.**
- **EXTERNO** = o `context.json` publicado. **O que cruza a fronteira** e o host consome.

→ **desenvolver a intent/governança = ler os `context.json`**. Nenhum banco precisa estar no ar. Você só sobe o
banco de **UM** repo quando edita os **internos dele** (e **republica** o `context.json`). Nunca os 6 juntos.

## 3 · As DUAS FASES (desacopladas)

| fase             | quem                             | usa backend?                | produz                                                               |
| ---------------- | -------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| **1 · PUBLICAR** | cada **repo** (no contexto dele) | **sim** (o backend do repo) | `<repo>/.governance/context.json` (externo) + `db.json` (interno)    |
| **2 · AGREGAR**  | o **host** de governança         | **NÃO**                     | `acme-governance/db.json` (intent/gate/grafo) — lê os `context.json` |

**Resiliência:** se o backend de um repo está fora na fase 1, ele **não republica** (o host usa o `context.json`
**anterior**). A fase 2 nunca falha por um banco estar fora.

## 4 · Onde mora o `context.json` publicado (o espectro solo → enterprise)

A projeção publicada precisa estar onde o host alcança **sem o backend do repo**. O espectro:

| porte                  | onde a projeção é publicada                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **dev solo / MVP**     | **versionado no git** (`context.json` commitado — git = distribuição + auditoria, zero infra). Freshness via **pre-commit hook**. Agrega offline em qualquer clone, sem subir banco. |
| **time pequeno/médio** | publicado no **meta-repo de governança** (commitado) ou um diretório compartilhado; CI republica no push.                                                                            |
| **grande empresa**     | cada repo publica sua projeção num **store/registry compartilhado** (ou no catálogo) via **CI**; o host/dashboard agrega de lá. O dev nunca sobe os bancos dos outros.               |

**Drift / anti-2ª-SSOT:** o `context.json` é um **snapshot regenerável** (não a fonte). Um **check de freshness**
(estilo lock-file) garante que ele bate com o backend — republicar é barato. A fonte continua sendo o repo; a
projeção é o **contrato** publicado (como uma spec OpenAPI publicada, ou um lock-file).

## 5 · Por porte (o que a owner pediu — direcionar solo × enterprise)

- **Dev solo (inclusive com neo4j):** roda o **seu** neo4j pros internos do repo que está editando; publica o
  `context.json` (1x, com o banco no ar). Pra desenvolver a **intent**, lê os `context.json` — **offline, sem
  subir os outros bancos**. Cada repo que ele toca, publica.
- **Grande empresa:** cada repo tem seu backend (neo4j/gerenciado) + **CI que publica** a projeção no store
  compartilhado a cada mudança. Quem trabalha na **governança/intent** consome as projeções — **nunca** sobe os
  bancos dos times. Escala pra dezenas/centenas de repos.

→ o **backend plugável + a publicação da projeção** dão os dois extremos com o **mesmo** modelo (contrato-first):
o que muda é **onde** a projeção é publicada (commitado no git ↔ store compartilhado) — um **knob**, não um redesenho.

## 6 · Prior art (pública)

- **Software catalog** — [Backstage](https://backstage.io/docs/features/software-catalog/) agrega **arquivos**
  (`catalog-info.yaml`) varridos por **providers**; o catálogo **NÃO roda o banco de cada serviço**. As relações
  são **derivadas** das projeções.
- **Context Data (plataformas de micro-frontend)** — o **host** agrega os **contextos publicados** por cada
  unidade; ele não executa o backend de cada módulo. (Padrão "provider/consumer".)
- **Graph snapshot derivado** — `2026-06-23-...graph-store-options.md`: a projeção é um snapshot determinístico,
  regenerável, offline — desacoplado da fonte.

## 7 · Mapa pra sim (o refactor do `build.ts`)

O `build.ts` fazia tudo num passo, **abrindo cada backend** pra agregar. O refactor separa:

1. **FASE 1 · publicar:** loop nos repos, abre o backend do repo (resiliente), deriva → escreve
   `<repo>/.governance/context.json` + `db.json`.
2. **FASE 2 · agregar:** lê os `context.json` **dos arquivos** (sem abrir banco) + intents + manifestos →
   `acme-governance/db.json`.

`context.json` é **VERSIONADO** na sim (commitado — é contrato; freshness via pre-commit hook = `_lib/freshness.ts` no lint-staged, evita drift e mantém o repo FONTE), e os caches/read-models (`db.json`/`dashboard.html`) vão pro **`.governance/.cache/`** (gitignored); em produção, publica-se no store
compartilhado (§4). _(follow-up: um comando `aggregate` separado, que roda SÓ a fase 2.)_

## 8 · Perguntas abertas (o que a DEC decide)

- **Q1 — formato do `context.json`:** o conteúdo exato da projeção externa (works publicados + answers + arestas +
  manifesto agregado?). Hoje = a saída de `deriveContext`. Incluir o manifesto na mesma projeção?
- **Q2 — onde publica por porte (DECIDIDO 2026-06-29):** **solo = commitado no git** (+ freshness hook · git =
  distribuição + auditoria) · time = meta-repo/store · enterprise = store/registry compartilhado (CI). O
  gitignored-cache foi **descartado** (não ganha em lugar nenhum: clone fresco/backend fora precisaria subir banco).
- **Q3 — freshness/drift:** o check que garante `context.json` == backend (republicar no CI / um lint). Quando roda?
- **Q4 — comando `aggregate` separado:** rodar a fase 2 sozinha (sem nenhum backend) — confirmar como 1ª classe.
- **Q5 — identidade/versão da projeção:** a projeção carrega um hash/versão pra o host saber se está fresca?
