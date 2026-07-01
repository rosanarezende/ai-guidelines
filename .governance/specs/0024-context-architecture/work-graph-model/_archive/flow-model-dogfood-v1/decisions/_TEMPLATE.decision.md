---
node: decision
id: dec-NNN # sequencial; arquivo: dec-NNN_<slug>.md (sem data no nome)
resolves: # back-pointer: questions + o §Dx que responde cada uma
  - { question: q-NNN, into: "§D1" }
grounded-by: # back-pointer: as research que embasam
  - res-NNN
body: <ref à consolidação compilada, se houver>
status: draft # draft | partial | resolved
# data da assinatura (quando vira resolved): no corpo (Gate humano)
---

# dec-NNN — <título da decisão>

**Uma decisão, N questions** (bundle coerente = um julgamento). Cada question mapeia a um `§Dx`;
supersedíveis individualmente (revisão = nova question, append-only).

## Decidido

- **§D1** (← `q-NNN`): <…>

## Gate humano (por question, conforme `mode`)

> `escolha` = owner arbitra entre as opções vivas da question · `aceitação` = owner
> aceita/rejeita/reenquadra o finding convergido.

- **`q-NNN`** — **Escolha:** <Opção X | aceito/rejeito/reenquadro> · **Justificativa/Ressalvas:** <…>
  · **Owner / Data:** @… / <YYYY-MM-DD>

## O que NÃO se decide

- <fronteiras explícitas>

<!-- id `dec-NNN` = handle sequencial (sem semântica no id; ver README § id). `status` por decisão
     (draft/partial/resolved) é o que torna o `decision-brief` um índice DERIVADO, tipo `state`. -->
