---
node: question
id: q-008
raised-by: intent-brief
mode: aceitação # reafirma decisão existente (não há alternativas vivas a arbitrar)
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão:
investigated-by: [res-002]
resolved-by: dec-001 §D8
---

# q-008 — Grafo / snapshot / banco podem ser SSOT?

**Pergunta:** a camada de consulta (grafo/snapshot/banco) pode virar fonte de verdade?

**Resposta convergida (aceitação — reafirma):** **NÃO** — grafo, snapshots e qualquer banco são **projeções
estritamente derivadas** do Markdown/YAML; **o repo vence**. Reafirma `[DEC-0024-G07]`/`G08`/`G23` e `GG-0005`.

**Alternativas que competiam:** banco/grafo como 2ª SSOT (rejeitado por doutrina, não por gosto).
