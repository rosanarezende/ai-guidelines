### Governance Gates — Guardrails de processo (opt-in: `governance-gates`)

> Fonte de verdade do guardrail **GG-0001**. Enforcement mecânico:
> [`cli/governance/gate-decidability-check.mjs`](../../../../cli/governance/gate-decidability-check.mjs)
> (gate `gate-decidability:check`, agregado em `yarn validate`). Projeção no seam do gate:
> `decision-brief-boilerplate.md` § "Checklist de decidibilidade (GG-0001)".
>
> **Guardrail** = regra operacional descoberta por dogfooding que reduz trabalho humano
> recorrente e é aplicada automaticamente. Não é entidade nova — é uma **regra** (este catálogo)
> com origem empírica `DOGFOOD-*` + um check que pode falhar (ADR 0021: enforcement > awareness).
> Taxonomia de `sources`: [`../../_meta/sources-taxonomy.md`](../../_meta/sources-taxonomy.md).

---

#### [GG-0001] Gate decidability before merit

```yaml
id: GG-0001
scope: opt-in
category: process
evidence_strength: emerging
sources: ["DOGFOOD-0024-G00", "DOGFOOD-0024-G02"]
opt_in_feature: governance-gates
applicable_languages: ["*"]
tags: [governance, gate, guardrail]
```

**Instruction (en):**
Before debating a decision's merit, verify the gate is decidable. A non-resolved `[DEC]` is gate-ready only if it has all of: a single assertion; an explicit "what is being accepted"; an explicit "what is NOT being accepted"; the competitors considered (why the alternatives fail); architecture separated from implementation; exactly one gate act; and no `Open` status (a DEC is born `Pendente`). If any is missing, the gate is not ready — fix the decision's form before its merit.

**Documentação (pt-br):**
Antes de discutir o mérito de uma decisão, verifique se o gate é **decidível**. Um `[DEC]` não-resolvido só está pronto para o gate se tiver, todos: uma afirmação única; "o que está sendo aceito"; "o que NÃO está sendo aceito"; os concorrentes considerados (por que as alternativas falham); arquitetura separada de implementação; exatamente um ato de gate; e nenhum status `Open` (o DEC nasce `Pendente`). Faltando qualquer um, o gate não está pronto — corrija a **forma** da decisão antes do **mérito**. Origem: aprendizado recorrente da reforma de `[DEC-0024-G00]` e `[DEC-0024-G02]` (dogfooding da Spec 0024).
