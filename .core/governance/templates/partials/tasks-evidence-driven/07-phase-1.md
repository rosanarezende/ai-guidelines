---

## Fase 1 — Implementação A (Stage 2)

> Primeiro sub-bloco de implementação derivado do `plan.md` v2. Cada sub-bloco encerra com **commit incremental atômico** — atomicidade tipo "história de usuário concluída", não "fim do dia". A IA deve fornecer a sugestão de commit como saída padrão de fechamento, sem perguntar. Cada sub-bloco referencia explicitamente o `[DEC-NNNN-*]` que o alimenta.

> **Nota — promoção de regra.** Se a spec promover regra editorial / de processo / de IA, classificar explicitamente como **universal** × **opt-in** (cf. `.core/process/governance-foundation.md` § "Categorias de regras").

### Sub-bloco [A] — [nome do sub-bloco no plan]

> Origem: [`<seção do plan>`](./plan.md#...) e [`[DEC-NNNN-XYZ]`](./decision-brief.md#dec-nnnn-xyz).

- [ ] **1.A.1** Descrição da task (1–3 linhas, com path concreto).
- [ ] **1.A.2** Próxima task.
- [ ] **1.A.N** Pipeline de check + test verde após o sub-bloco A (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] **1.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.A.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco A>". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [B] — [nome do sub-bloco no plan]

- [ ] **1.B.1** ...
- [ ] **1.B.2** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.B.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco B>". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.
