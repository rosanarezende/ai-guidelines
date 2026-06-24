---
node: question
id: Q-G25-02
raised-by: intent-brief
investigated-by:
  - research/2026-06-24-intent-brief-work-initiation-artifact.md
resolves-into: DEC-0024-G25 §D2
status: resolvida
---

# Q-G25-02 — `spec` (kind) e `spec.md` (doc) carregam viés de spec-kit?

**Pergunta:** os nomes herdados (`spec`) enviesam a ontologia? Qual a umbrella e o pilar corretos?

**Resposta convergida:** doc → `intent-brief`; pilar `spec → delivery`; umbrella **mantém `kind`**.
Largar "MECE" na fala → _"7 tipos de trabalho / pilares de valor"_.

**Alternativas que competiam (resolvidas):** `feature`/`capability` (escala SAFe — descartadas);
`type`/`pillar` para a umbrella (descartadas pelo **scan do código**).

**Evidência:** benchmark de naming + scan de 1021 ocorrências de `kind` (ver `investigated-by`).
