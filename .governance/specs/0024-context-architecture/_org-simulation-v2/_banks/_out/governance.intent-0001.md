# Board (GERADO) — intent-0001: Sistema de login (multi-repo)

> **GERADO pelo banco** (`node _banks/run.ts`) — NÃO EDITAR. Projeção DERIVADA, regenerável da fonte.

Consome as projeções dos repos: acme-design-system, acme-mfe-support (banco→banco).

## Open-questions (respondida ≠ resolvida)

- **q1** — RESOLVED ✅ · ← `acme-design-system/exploration-001`
  - verdict: "não — o DS não tem form validado; cada MFE reimplementa hoje → precisa criar o componente"
- **q2** — answered · decisão pending · ← `acme-mfe-support/exploration-001`
  - verdict: "viável (pub/sub conta as falhas e dispara após N); SE proativo AJUDA é hipótese de produto → experiment dedicado"

## Contracts

- **form-component**: KNOWN ✅ (awaits q1)
- **failure-event**: pending (awaits q2)

## Breaks-into (plano por status — DERIVADO)

- **done**: acme-design-system/exploration-001, acme-mfe-support/exploration-001
- **active**: (nenhum)
- **draft**: (nenhum)
