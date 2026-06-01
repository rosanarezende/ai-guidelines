# Checkpoint Comment Template — comentários de Gate em PRs governance-first

> **O que é.** Template **copiável** para os comentários de proveniência de um **checkpoint** (unidade de implementação de uma spec) num Pull Request real. Padroniza a rastreabilidade do ritual de **Gate** — `implementation → Technical Audit Gate → Architectural Review Gate → Human Gate` — para que humano, Claude, Codex e ChatGPT postem comentários consistentes (não "crus" demais).
>
> **Vocabulário (cf. `plan.md § Glossário` da spec em curso):** **PR / `#N`** = Pull Request real do GitHub · **Checkpoint N** = unidade de implementação da spec · **Gate** = ritual de validação. **Não usar "PR-N" como unidade interna** — só `Checkpoint N`.
>
> **Origem (dogfooding):** ritual validado ao vivo no PR **#32** (Spec 0024), checkpoints 1–2.1. Relaciona-se com ADR 0020 (governança precede execução), ADR 0024 (Draft≠Ready≠Mergeable; modos `unit`/`sequential`) e `pr-title-conventions.md`.

---

## Cabeçalho obrigatório (sempre)

```md
🧭 Workflow Provenance (este comentário)
ref: #<PR> @ <sha>
checkpoint: <N ou N.N>
spec: 0024-context-architecture
role: <implementation|technical_audit|architectural_review|human_gate|outro>
actor: <ex.: claude-cli|codex-cli|chatgpt|@owner|tool>
model: <opcional — volátil>
at: <ISO 8601 ou timezone local>
```

---

## Corpo por `role`

### `role: implementation`

```md
## Implementação — Checkpoint <N>: <título curto>

- Objetivo: <1 linha>
- Arquivos alterados: <lista>
- Validação executada: <comandos — ex.: yarn format ; yarn validate>
- Escopo: <atômico? invadiu escopo de outro checkpoint? — não/sim + porquê>
- Notas: <churn, renormalização de serializer, decisões de escopo, etc.>
```

### `role: technical_audit`

```md
## Technical Audit Gate — Checkpoint <N>

- Status: PASS | FAIL
- Escopo auditado: commit <sha> + arquivos <lista>
- Achados críticos: <lista | "Nenhum">
- Achados não-bloqueantes: <lista | "Nenhum">
- Evidências: <bullets com comandos/paths>
- Recomendação final: <1 linha>
```

### `role: architectural_review`

```md
## Architectural Review Gate — Checkpoint <N>

- Status: PASS | NEEDS-FIX
- Coerente com o contrato da spec: <2–4 bullets>
- Riscos de drift: <lista | "Nenhum">
- Mudanças recomendadas: <pequenas e acionáveis | "Nenhuma">
- Gate: libera para human_gate? <sim | não>
```

### `role: human_gate`

```md
## Human Gate — Checkpoint <N>

- Status: APROVADO | BLOQUEADO
- Justificativa: <curta>
- Autorização explícita: <"merge autorizado" | "merge não autorizado">
```

---

## Regras

- **Nunca usar "PR-N"** como unidade de implementação. Só **`Checkpoint N`**. `PR / #N` = Pull Request real.
- `ref:` sempre no formato **`#<PR> @ <sha>`**.
- `checkpoint:` sempre presente (`N` ou `N.N`).
- `spec:` presente (slug da spec ativa).
- `role:` é string livre, mas os quatro acima têm corpo padrão (papéis reconhecidos = hints de projeção, não enum fechado).
- `model:` é **opcional** (volátil — não obrigar).
- **Um comentário por evento de Gate.** Não reescrever comentários anteriores (são trilho de auditoria); correções vão em comentário novo (errata).
