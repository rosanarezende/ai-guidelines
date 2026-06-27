---
node: question
id: q-009
raised-by: tarefa # levantada DURANTE a iteração (não pelo intent) — o 9º ponto, fora dos 8 da G25
mode: escolha
status: resolvida
# ↓ GERADO dos back-pointers — não editar à mão:
investigated-by: [] # §D9 convergiu inline (research OPCIONAL — sem benchmark/scan a fazer)
resolved-by: dec-001 §D9
---

# q-009 — Como a retomada mostra ONDE estávamos iterando?

**Pergunta:** o `cursor` (que aponta o nó ativo) basta para uma retomada específica, ou precisa de
**sub-estado** (onde estamos NA resolução daquela question)?

> **Por que `q-009` e não `q-003`:** os 8 pontos do modelo G25 são `q-001..q-008` (→ §D1..§D8). Esta pergunta
> **emergiu durante o próprio trabalho** (`raised-by: tarefa`) — é o caso vivo da não-linearidade append-only
> que o modelo §6 descreve. Por isso é o **9º** ponto do bundle, ainda aberto (vira §D9 ao resolver).

## Opções (menu neutro)

### Opção A — cursor aponta só o nó ativo

- **Problema que resolve:** a retomada sabe QUAL question.
- **Benefícios:** mínimo; zero campo novo.
- **Tradeoffs:** não diz ONDE na resolução daquela question.
- **Riscos:** retomada genérica ("estávamos em q-009"), sem o sub-ponto.
- **Quando escolher:** questions curtas (resolvem rápido).
- **Quando NÃO escolher:** questions longas, várias rodadas.

### Opção B — cursor + `note` curta no `state`

- **Benefícios:** dá o sub-ponto em uma linha, sem inchar.
- **Tradeoffs:** a `note` é mantida à mão (pequena mutação no state, ok — é progresso).
- **Quando escolher:** sempre que a iteração tem sub-pontos.

### Opção C — a `question` aberta carrega "Estado da iteração"

- **Benefícios:** o detalhe (o que convergiu / o que falta NAQUELA question) mora na própria question; a
  retomada lê `cursor` → abre a question → vê exatamente onde parou.
- **Tradeoffs:** a question muta enquanto `aberta` (ok — só sela ao `resolver`).

## Resposta convergida — **B + C**

**B + C** (validado pela owner, 2026-06-24): `state.cursor` ganha `node` + `note` (o sub-ponto, 1 linha) **e**
a `question` aberta carrega "Estado da iteração". A retomada fica **específica**: o cursor aponta `q-009` com
a nota, e a question mostra o detalhe e as opções vivas. O `note` é **progresso** (mutação pequena no `state`,
não SSOT nova); esta seção **sela** agora que está resolvida.

> **A (rejeitada):** cursor só com o nó → retomada genérica, sem o sub-ponto.
> **Investigação inline (research opcional):** §D9 convergiu na própria question (raciocínio de design), sem
> nó `research` — o modelo permite research **opcional** quando não há benchmark/scan a fazer.
> **Gate humano** (escolha + justificativa + owner/data): registrado em `dec-001 § Gate humano`.
