# \_org-simulation-v2 — passo a passo (governança como registries)

> Recomeço limpo: **nada de arquivos aleatórios**. Construímos **uma peça por vez**, confirmando o template e ajustando o que for necessário.

**Escopo desta rodada:** só a **`intent-0001`** — mesmo objetivo do login da v1 (arquivada em `_archive/org-simulation-v1`).

**Premissa (a confirmar — ver Lente 5 no tracker):** a governança é o que uma **app/form de intents salvaria** (num **banco** ou em **arquivos**, backend plugável). As intents/registries **se comunicam só com outras registries** (Lente 3) — separando **governança** de **conteúdo**.

## Estrutura (file-first — Lente 5, backend "arquivos")

Cada **repo de trabalho** tem um **`.governance/`** na raiz (separa governança do código):

    <repo>/.governance/
      registry/<kind>.yml            ← índices por kind (delivery, exploration, …)
      works/<tipo>/<slug>_<num>/     ← cada work (brief + closing + deliberation do work)

O **meta-repo** `acme-governance/` guarda os `intents/` (a governança da org). O **banco** (`_banks/`) **deriva** de cada `.governance/`. Ids = `<kind>-<slug>_<num>` (slug legível + numérico estável embutido).
