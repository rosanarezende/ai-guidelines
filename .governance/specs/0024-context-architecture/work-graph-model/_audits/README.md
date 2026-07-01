# Auditorias adversariais (agente revisor externo) — a evidência por trás do modelo

> Rodadas de auditoria **adversarial** rodadas na sim (agente conselheiro externo, papel de auditor). São **apoio, não autoridade** (o repo/gates vencem) — mas são a evidência que embasou a taxonomia v2 e a Lente 8. Cada arquivo tem o **prompt** (reusável) + a **resposta verbatim** + o que foi **incorporado**.
>
> ⚠️ Anonimizado (`acme-*`); nenhuma fonte confidencial. As respostas verificadas **contra o repo** antes de aceitas.

| rodada                           | foco                                          | achado central                                                                                  | virou                                                                                                    |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [1](round-1-benchmark-gaps.md)   | benchmark de gaps do modelo                   | confundir **tipo** com **origem/reatividade**; incident não sai de breakdown planejado          | eixo `source` ortogonal; veredito do incidente                                                           |
| [2](round-2-work-taxonomy.md)    | os 4 tipos moram na mesma categoria?          | `experiment`→aprendizado · `fix/patch`→`maintenance` · menos tipos + mais dimensões             | as **famílias** + dimensões (deliberação da taxonomia)                                                   |
| [3](round-3-end-to-end.md)       | o fluxo novo ponta-a-ponta                    | falta um **envelope transacional** universal (actor/base-revision/idempotency/classification/…) | a **Lente 8** + as correções (explore-resolution, gate append-only, contrato-nó, GlobalRef, loop-budget) |
| [4](round-4-trust-boundaries.md) | régua mais alta (o que sobrevive ao envelope) | tudo é **autocertificado**; falta **trust boundary** de 1ª classe + política normativa          | a **Lente 9** (confiança & política) + P0 de política; **encerra a auditoria** → sim adversarial         |
