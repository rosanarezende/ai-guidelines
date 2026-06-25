---
node: question
id: q-003
raised-by: tarefa # levantada DURANTE a iteração (não pelo intent original)
mode: escolha
status: aberta
# ↓ GERADO — vazio enquanto `aberta`; preenche quando research/decision aparecem:
investigated-by: []
resolved-by: null
---

# q-003 — Como a retomada mostra ONDE estávamos iterando?

**Pergunta:** o `cursor` (que aponta o nó ativo) basta para uma retomada específica, ou precisa de
**sub-estado** (onde estamos NA resolução daquela question)?

## Opções (menu neutro)

### Opção A — cursor aponta só o nó ativo

- **Problema que resolve:** a retomada sabe QUAL question.
- **Benefícios:** mínimo; zero campo novo.
- **Tradeoffs:** não diz ONDE na resolução daquela question.
- **Riscos:** retomada genérica ("estávamos em q-003"), sem o sub-ponto.
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

## Estado da iteração (enquanto `aberta`) — ONDE estamos AGORA

> Convergindo para **B + C**: `state.cursor` ganha `node` + `note` (o sub-ponto, 1 linha) **e** a
> `question` aberta carrega esta seção. Assim a retomada é **específica**: o cursor diz `q-003` + a nota,
> e a question mostra o detalhe e as opções vivas. **Pendente:** owner validar B+C.
