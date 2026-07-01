---
node: question
id: q-007
raised-by: intent-brief
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão:
investigated-by: [res-002]
resolved-by: dec-001 §D7
---

# q-007 — Pausa ("nem ativo, nem fechado") é um 6º status?

**Pergunta:** o limbo precisa de um status armazenado (`paused`) no `LifecycleStatus`?

**Resposta convergida:** **NÃO — pausa é DERIVADA** de uma fonte, nunca status armazenado:
**blocked** (de um `finding` aberto sob investigação; cai sozinho quando o `learning-record` `resolves` o
finding) · **paused** (de uma **pausa deliberada** com registro próprio: quem/quando/porquê/retomar-quando).
`LifecycleStatus` não ganha "pausado".

**Alternativas que competiam:** adicionar `paused` ao `LifecycleStatus` (descartado — drift de despausar à mão).
