---
node: decision
id: dec-001
resolves: # back-pointer: questions + o §Dx que responde cada uma
  - { question: q-001, into: "§D1" }
  - { question: q-002, into: "§D2" }
  # … q-003..008 → §D3..D8 (bundle de 8)
grounded-by:
  - res-001
body: research/2026-06-24-decided-g25-work-flow-model.md
status: draft
---

# dec-001 — Modelo de fluxo do trabalho governado

> Representa a `DEC-0024-G25` do repo, mas com **id sequencial `dec-001`** para **testar o esquema**
> (ver README § id de decisão). Data de assinatura (`resolved`): iria **no corpo**, não no nome.

**Uma decisão, N questions.** Resolve um **bundle coerente** (`q-001..008`) — um julgamento único. Cada
question mapeia a um `§Dx` via `resolves[].into`; supersedíveis individualmente (revisão = nova question,
append-only).

- **Corpo decidido (compilação):** `research/2026-06-24-decided-g25-work-flow-model.md` (D1–D8).
- **Status:** `draft` até a owner cravar (vira `resolved`, com data no corpo).
