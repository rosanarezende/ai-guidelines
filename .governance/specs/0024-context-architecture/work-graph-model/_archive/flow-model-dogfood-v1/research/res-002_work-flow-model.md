---
node: research
id: res-002
investigates:
  - q-003
  - q-004
  - q-005
  - q-006
  - q-007
  - q-008
method: assessment (pre-coding-review / dogfood)
# data da investigação: no corpo
---

# res-002 — modelo de fluxo: cadeia tipada, 7 tipos, hierarquia, fechamento, pausa

> Data: 2026-06-24 · (data no corpo, não no nome)

**Questões:** `q-003` (grafo tipado) · `q-004` (7 tipos) · `q-005` (hierarquia G22) · `q-006` (fechamento) ·
`q-007` (pausa) · `q-008` (derived-only).

**Evidência / achados:** a cadeia `intent → research/finding → decision → tasks` modela-se como **grafo
tipado** (nós + arestas como dado); `finding` é nó-com-status, `research`/`decision` são nós-artefato;
não-linearidade = append-only + `supersedes`; `experiment` é primário (`promotes-to`); `Frente`/`Etapa` =
lentes derivadas opcionais; fechamento em **2 eixos**; pausa **derivada** (blocked/paused). Tudo
**derived-only** (o repo vence).

**Recomendação:** _não há `escolha` a enviesar aqui_ — é uma síntese de modelagem. As opções vivas (quando
existem) moram nas próprias questions; o gate humano é por question na `decision`.

**Conclusão (alimenta `dec-001` §D3–§D8):** adotar a cadeia como grafo tipado pelos 7 tipos, com G22 refinada,
fechamento em 2 eixos e pausa derivada.

**Trilha completa:** `research/2026-06-24-governed-work-flow-model.md` (a pre-coding-review datada real que
este nó representa).
