# Simulação de 2 repos irmãos — falsificação ampla do modelo (cross-repo)

> **Ambiente controlado, não-autoridade.** Simula **2 repositórios irmãos** de um mesmo produto — `backend/`
> (api) e `frontend/` (web) — cada um governado pelo modelo de fluxo (G25), para falsificar os templates **e**
> preparar a validação de **multi-repositório + banco**. Grounding:
> `research/2026-06-24-opening-artifact-by-kind-and-repo-simulation.md` +
> `research/2026-06-24-cross-repo-governance-graph.md`.

## Por que 2 repos

Um produto real atravessa repos (a owner: app + editorial). Uma `delivery` de login social toca **api e web**
ao mesmo tempo. Com 2 repos a coordenação cross-repo deixa de ser hipótese:

- cada repo é **SSOT do seu próprio governo** (o repo vence);
- a aresta `coordinates-with: <repo>/<id>` liga trabalhos **entre** repos;
- **ids colidem** (`backend/deliv-001` × `frontend/deliv-001`) → a **identidade global** (D2) que o banco terá
  de resolver aparece concreta, não teórica.

## Estrutura (cada repo)

```
<repo>/
  registry/                 ← índice por-kind (MECE): 1 arquivo por tipo (os 7)
    delivery.yml  experiment.yml  spike.yml  incident.yml  proposal.yml  patch.yml  fix.yml
  works/                    ← workspaces dos Dense (Virtual NÃO tem pasta — vive no registry)
    <kind>_<slug>/
```

`registry/<kind>.yml`: **Virtual** (proposal/patch/fix) = a entrada **é** o trabalho; **Dense** = a entrada
**indexa** o `workspace`. Schema: `../_templates/registry-entry.yml`.

## Cenário desta rodada — "Login social (OAuth)", cross-repo

| Repo     | Trabalho                | kind            | Papel                                             |
| -------- | ----------------------- | --------------- | ------------------------------------------------- |
| backend  | `prop-001`              | proposal        | origem: propõe o login social → promove           |
| backend  | `deliv-001` (oauth-api) | delivery        | endpoints OAuth · coordena com frontend/deliv-001 |
| backend  | `spike-001`             | spike           | qual lib OAuth · fecha em learning-record         |
| backend  | `inc-001`               | incident        | refresh de token quebrou → spawna `fix-001`       |
| backend  | `fix-001`               | fix (Virtual)   | corrige o refresh (registry, sem pasta)           |
| frontend | `deliv-001` (oauth-ui)  | delivery        | tela de login · coordena com backend/deliv-001    |
| frontend | `exp-001`               | experiment      | posição do botão · won → promove                  |
| frontend | `patch-001`             | patch (Virtual) | bump de ícones (registry, sem pasta)              |

Os **7 kinds** aparecem entre os 2 repos; as arestas cross-repo (`coordinates-with`) são o que um **banco
agregaria** — o próximo passo de validação (multi-repo + banco).

## Cenário 2 — time multi-repo (3 devs em paralelo)

Feature **"Checkout 1-clique"** atravessa os 2 repos com **3 devs**: `@dev-a` (backend `cp-payment`), `@dev-c`
(backend `cp-orders`), `@dev-b` (frontend, shell + integração).

- **Divisão:** por repo **+** por `Frente` (`group-by(owner)`, §D5) → 3 frentes.
- **Intent NÃO transita** entre repos: `prop-002` faz **fan-out** em deliveries coordenadas (`coordinates-with`).
- **Paralelização:** `cp-payment ∥ cp-orders ∥ cp-ui-shell` (sem dependência); só `cp-ui-integration` fica
  **`blocked` derivado** até `backend/deliv-002#cp-payment` (§D7). Deriva da topologia, não declarada à mão.

Detalhe + falsificação: `research/2026-06-25-multi-repo-team-and-public-work-index.md`.

## Índice público de trabalho (derivado)

O `active.yml` real (índice de specs ativas) **se sustenta como disciplina** (derivado / drift-guarded /
descoberta cross-machine) mas **abre o escopo**:

- `<repo>/active-work.yml` — por-kind, projeta de `registry/` + `state.yml` (Dense) / `registry/` (Virtual).
- `active-work.aggregate.yml` — cross-repo, ids namespaced `<repo>/<id>`, com view derivada `features` (o **banco**).

## Limites

Não-autoridade; não materializa o `registry/` real nem o `active-work` (ADR 0010 / runtime), não move topologia,
não crava DEC.
