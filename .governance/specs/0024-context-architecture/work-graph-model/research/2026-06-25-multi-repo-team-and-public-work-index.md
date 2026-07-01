---
artifact-kind: pre-coding-review
subject: "modelo em escala de TIME e MULTI-REPO: dividir/paralelizar uma feature multi-repo com N devs; e o índice público de trabalho (active-specs) no novo modelo"
date: 2026-06-25
reviewer: internal
method: assessment
---

# Pre-coding review — time + multi-repo: divisão/paralelização e o índice público de trabalho

> **Natureza:** `pre-coding-review` (dogfood). **Não-autoridade**. Em divergência vencem `state.yml`,
> `tasks.md`, `decision-brief.md`, `reviews/`+`gates/`, Git/GitHub. Falsifica o modelo (G25) em **duas escalas**
> que faltavam: **time** (N devs em paralelo) e **multi-repo**. Instrumento: `_repo-simulation/` (2 repos,
> feature "checkout 1-clique" com 3 devs). **Linhagem:** `cross-repo-governance-graph` ·
> `opening-artifact-by-kind-and-repo-simulation` (F3) · `decided-g25` (§D5 Frente, §D7 bloqueio derivado, §D8
> derived-only).

## Parte 1 — feature multi-repo com N devs em paralelo

### 1.1 Como dividir

Dois eixos de divisão, **ambos já no modelo**:

- **Por repo** (cada repo é SSOT do seu próprio governo): a feature vira **deliveries coordenadas**, uma por repo.
- **Por `Frente` dentro do repo** (§D5): `Frente = group-by(owner/area)` sobre os checkpoints — **lente
  derivada, não nível fixo**. N devs = N frentes.

Simulação — "checkout 1-clique", **3 devs / 2 repos**:

| Dev      | Repo               | Checkpoint(s)                       | Frente |
| -------- | ------------------ | ----------------------------------- | ------ |
| `@dev-a` | backend/deliv-002  | `cp-payment`                        | A      |
| `@dev-c` | backend/deliv-002  | `cp-orders`                         | C      |
| `@dev-b` | frontend/deliv-003 | `cp-ui-shell` + `cp-ui-integration` | B      |

→ 3 frentes derivadas de `owner`; o **`gate` continua POR checkpoint** (cada dev fecha o seu; a Frente só agrupa/navega).

### 1.2 Intent transita entre repos? — **NÃO; ele se RAMIFICA (fan-out)**

O `intent-brief` é **selado e por-repo** (cada repo SSOT). Uma feature multi-repo **não move** um intent entre
repos — ela **nasce de uma origem compartilhada** (`prop-002`) que faz **fan-out** em **deliveries coordenadas**,
cada uma com seu `intent-brief` selado, ligadas pela aresta **`coordinates-with: <repo>/<id>`** (namespaced).

> Princípio: **o repo vence**; nada cruza a fronteira de SSOT. O que cruza é a **aresta** (dado), não o
> documento. (Honra a cross-repo research: a camada cross-repo **expõe e liga**, **não dita**.)

### 1.3 É possível paralelizar? — **SIM; o modelo expressa o que é paralelo vs serial**

- **Paralelo:** checkpoints **sem dependência** rodam juntos. Na simulação, `cp-payment` (@dev-a) ∥ `cp-orders`
  (@dev-c) ∥ `cp-ui-shell` (@dev-b) — **3 devs em paralelo**.
- **Serial só onde há dependência:** `cp-ui-integration` (@dev-b) `depends-on backend/deliv-002#cp-payment` →
  fica **`blocked` DERIVADO** (§D7) até a API ficar `done`; o bloqueio **cai sozinho** (sem despausar manual = sem drift).

→ A paralelização **não é declarada à mão: deriva da topologia** (`depends-on`). O **caminho crítico cross-repo**
= a cadeia de `depends-on` entre repos.

### 1.4 O que isso falsifica do modelo

- ✅ `Frente` (§D5) **escala para time:** `group-by(owner)` dá as N frentes.
- ✅ Bloqueio derivado (§D7) **escala cross-repo:** `depends-on <repo>/<id>` → `blocked` derivado.
- 🆕 **[F4] Falta um nó de "feature/coordenação cross-repo".** Hoje a feature multi-repo é só um _cluster_ de
  deliveries ligadas por `coordinates-with` — derivável, mas sem nome. Candidato: uma **view derivada "feature"**
  (group-by do grafo de `coordinates-with`), **NÃO** um 8º kind (evita 2ª SSOT). Aparece no índice agregado (Parte 2).

## Parte 2 — o índice público de trabalho no novo modelo

### 2.1 O que existe hoje (FATO)

`.governance/runtime/specs/active.yml` — **índice derivado de specs ativas**, descoberta cross-machine sem
dashboard. Entry real: `{ id, slug, branch, stage(←state.yml), status, spec_path, source_state_path, updated_by/at }`.
É **projeção** (escrita só por `publish-state`; `active-specs:check` é drift-guard fato→projeção;
`completed`→`history.yml`). É **spec-cêntrico** e **single-repo**.

### 2.2 Ele se sustenta? — **A DISCIPLINA sim; o ESCOPO precisa abrir**

**Preserva-se (é o próprio §D8 derived-only):** derivado, não editado à mão (via `publish-state`) ·
drift-guarded · descoberta cross-machine sem dashboard · `active`×`history`.

**Adapta-se (3 mudanças):**

1. **Spec-cêntrico → work-cêntrico por KIND.** `active_specs` → `active_work`; adiciona `kind`. **Dense** projeta
   de `workspace/state.yml` (como hoje); **Virtual** (proposal/patch/fix, sem state.yml) projeta da entrada em
   `registry/<kind>.yml`. `stage`/`status` generalizam por kind.
2. **Single-repo → multi-repo.** Cada repo mantém seu `active-work.yml` (o repo vence). O índice **público
   cross-repo** é uma **agregação derivada** (`active-work.aggregate.yml`) com **ids namespaced `<repo>/<id>`**
   (resolve a colisão D2/F3) — a função do **banco** (regenerável, drift-checked, **NÃO-SSOT**).
3. **Surfacing de coordenação.** O índice carrega `coordinates-with`/`promotes-to`; do grafo dessas arestas
   deriva-se a **view "feature"** (F4) — o valor de portfólio que a owner quer (ver o multi-repo num lugar só).

### 2.3 Materializado na simulação

- `backend/active-work.yml` + `frontend/active-work.yml` — índice por-repo, por-kind (mostra `kind`, `coordinates-with`).
- `active-work.aggregate.yml` — agregação cross-repo (ids namespaced + view `features`).

### 2.4 Caminho de adoção (sem big-bang)

- Renome conceitual `active-specs` → `active-work` + campo `kind` (retrocompatível: `spec` vira `delivery`).
- `active-specs:check` → `active-work:check` (mesma disciplina, +kind, +Virtual-from-registry).
- Agregação cross-repo = a etapa do **banco** (F3/D2), estritamente derivada — **fundacional, fora do #45**.

## Em aberto / fundacional

- **[F4]** view derivada "feature" (cluster de `coordinates-with`) — não 8º kind.
- Materializar `registry/` + `active-work` reais (evolução de `.governance/registry.yml` + `active.yml`) — fora do #45.
- O banco de agregação cross-repo (D2 identidade global) — frente própria.

## Âncoras

- `.governance/runtime/specs/active.yml` (índice real) · `src/cli/activeSpecsConsistencyCheck.ts` (disciplina
  drift-guard fato→projeção) · `README.md` §"Operação do ciclo" (`registry.yml` SSOT + `active.yml` índice derivado).
- `research/2026-06-24-cross-repo-governance-graph.md` · `research/2026-06-24-opening-artifact-by-kind-and-repo-simulation.md`
  (F3) · `research/2026-06-24-decided-g25-work-flow-model.md` (§D5/§D7/§D8).
