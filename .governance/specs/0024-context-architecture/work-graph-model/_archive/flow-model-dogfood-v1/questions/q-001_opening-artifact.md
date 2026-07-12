---
node: question
id: q-001
raised-by: intent-brief
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão (um check garante que batem):
investigated-by: [res-001]
resolved-by: dec-001 §D1
---

# q-001 — Qual artefato o humano alimenta para iniciar um trabalho?

**Pergunta:** qual o substituto do `spec.md` (enviesado por requisito-a-satisfazer) que sirva aos 7 tipos?

**Resposta convergida:** um doc de **abertura polimórfico** (`intent-brief`) — kernel de 4 linhas
obrigatório + corpo por kind.

**Alternativas que competiam:** manter `spec.md`; `brief` genérico; lentes compostas.

> `investigated-by`/`resolved-by` são **gerados** dos back-pointers (`res-001.investigates`,
> `dec-001.resolves`) — legibilidade standalone **sem** duplicação à mão (A+); fonte única, view materializada.
