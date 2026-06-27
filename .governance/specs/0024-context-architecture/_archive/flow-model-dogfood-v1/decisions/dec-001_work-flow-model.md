---
node: decision
id: dec-001
resolves: # back-pointer: o BUNDLE de questions + o §Dx que responde cada uma
  - { question: q-001, into: "§D1" }
  - { question: q-002, into: "§D2" }
  - { question: q-003, into: "§D3" }
  - { question: q-004, into: "§D4" }
  - { question: q-005, into: "§D5" }
  - { question: q-006, into: "§D6" }
  - { question: q-007, into: "§D7" }
  - { question: q-008, into: "§D8" }
  - { question: q-009, into: "§D9" } # convergida no dogfood (retomada/cursor); levantada durante o trabalho
grounded-by:
  - res-001 # naming/abertura (q-001/q-002)
  - res-002 # cadeia/7-tipos/hierarquia/fechamento/pausa (q-003..q-008)
  # §D9 (q-009) convergiu inline na própria question — research OPCIONAL (sem benchmark/scan a fazer)
body: research/2026-06-24-decided-g25-work-flow-model.md
status: resolved # as 9 questions convergiram — ver nota sobre crave (owner/date null = NÃO cravada)
# data da assinatura (crave / Human Gate): no corpo, preenche AO CRAVAR (fora desta rodada)
---

# dec-001 — Modelo de fluxo do trabalho governado

> Representa a `DEC-0024-G25` do repo, com **id sequencial `dec-001`** (ver README § id).

**Uma decisão, N questions.** O bundle nasceu com **8 pontos** (`q-001..q-008` → §D1..§D8, a G25 compilada) e
**cresceu para 9**: `q-009` (retomada/cursor) foi **levantada durante o trabalho** (`raised-by: tarefa`) — a
não-linearidade append-only do §D3 acontecendo no dogfood. Cada question mapeia a um `§Dx`; supersedíveis
individualmente.

- **Corpo decidido (compilação):** `research/2026-06-24-decided-g25-work-flow-model.md` (D1–**D9**).
- **Progresso:** **9/9** — todas convergidas. Derivado de `resolves` (todo `into` preenchido).
- **Dois eixos (o próprio §D6 aplicado a esta DEC):** `status: resolved` = **eixo Resultado** (as 9 questions
  convergiram). `owner`/`date` `null` = **eixo Autoridade**: a DEC **ainda NÃO foi cravada** (Human Gate no
  `decision-brief.md` real) — isso é autorização separada, **fora desta rodada**.

## Gate humano (por question, conforme `mode`)

> `q-001..q-008` convergiram via research/compilação (sem cerimônia de gate por question no dogfood).
> Registrado aqui o gate **vivo** desta rodada:

- **`q-009`** (`escolha`) — **Escolha:** **B + C** (cursor `node`+`note` no `state` · "Estado da iteração" na
  question) · **Justificativa:** retomada específica sem 2ª SSOT; `note` é progresso e sela ao resolver ·
  **Owner / Data:** @rosanarezende / 2026-06-24.

## O que NÃO se decide (nesta rodada)

- **Cravar** a DEC-0024-G25 (Human Gate / edição do `decision-brief.md` real) · avançar topologia · Ready ·
  merge. O dogfood **converge o conteúdo**; o crave é ato humano separado e autorizado à parte.
