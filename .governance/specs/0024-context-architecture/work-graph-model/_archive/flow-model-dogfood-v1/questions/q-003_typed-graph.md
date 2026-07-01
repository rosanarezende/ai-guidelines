---
node: question
id: q-003
raised-by: intent-brief
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão:
investigated-by: [res-002]
resolved-by: dec-001 §D3
---

# q-003 — O fluxo (intent→research→decision→tasks) é prosa ou grafo tipado?

**Pergunta:** modelamos a cadeia como prosa/espelho-manual (`state ↔ tasks ↔ plan`) ou como grafo tipado?

**Resposta convergida:** **grafo tipado** — nós + arestas como dado, **derived-only**, SSOT em
`state.yml § topology`. Tarefas nascem **depois** das decisões; a não-linearidade vira **append-only +
`supersedes`** (o velho fica `Convergido`/`Resolved`, nada se reescreve). `finding` é o **nó** (a pergunta)
com `status`; `research`/`decision` são **nós-artefato** que ele referencia.

**Alternativas que competiam:** prosa/espelho-manual (a dor original: 3 representações da topologia brigando).
