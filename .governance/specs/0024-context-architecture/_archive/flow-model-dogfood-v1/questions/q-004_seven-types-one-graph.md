---
node: question
id: q-004
raised-by: intent-brief
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão:
investigated-by: [res-002]
resolved-by: dec-001 §D4
---

# q-004 — Como os 7 tipos percorrem a cadeia? `experiment` é filho de `delivery`?

**Pergunta:** cada tipo tem fluxo próprio ou percorre a mesma cadeia? Qual a relação `experiment`↔`delivery`?

**Resposta convergida:** **um grafo, sete caminhos** — cada tipo percorre um subconjunto (Dense mais, Virtual
colapsa). **`experiment` é PRIMÁRIO** (em growth, o trabalho principal; `won` → `promotes-to` `delivery`
herdando `hypothesis`/`successMetrics`; `lost`→clean-up/kept; `inconclusive`→itera) — **promoção lateral, não
subordinação**. A investigação de um `finding`, **por risco**: `research` (mesa) ou `spike` (PoC). `experiment`
**não** é modo de investigação.

**Alternativas que competiam:** `experiment` como investigador-filho de `delivery` (descartado).
