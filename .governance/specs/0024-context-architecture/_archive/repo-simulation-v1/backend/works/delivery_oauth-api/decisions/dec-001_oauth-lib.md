---
node: decision
id: dec-001
resolves:
  - { question: q-001, into: "§D1" }
grounded-by:
  - backend/spike-001 # o learning-record do spike embasa a escolha (investigação por spike)
status: resolved
---

# dec-001 — lib OAuth + armazenamento de token

**§D1** (← `q-001`): adotar `authlib-x` (recomendada pelo `spike-001`); tokens cifrados em repouso.

## Gate humano (por question)

- **`q-001`** (`escolha`) — **Escolha:** `authlib-x` · **Justificativa:** refresh nativo + tipos (evidência do
  `spike-001`) · **Owner / Data:** @rosanarezende / 2026-06-24.
