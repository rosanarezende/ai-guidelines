# \_templates — os moldes do modelo (5 trabalho + 2 ferramentas), adaptados às 4 lentes

> Coletânea **canônica** dos moldes, adaptada às decisões do `research/2026-06-25-work-graph-model.md`.
> Não-autoridade (o template vivo real, pós-DEC, vai para `.core/governance/templates/`).

## Estrutura da pasta

Espelha a regra **referência ≠ conteúdo**: a raiz guarda **estrutura / índice / referência** (que ancoram as arestas); as subpastas guardam **conteúdo por kind** (que **não** carrega aresta).

```
_templates/
  intent.yml · registry-entry.yml · proposal.yml · exploration.yml · state.yml    ← estrutura / índice / referência (ancoram arestas)
  briefs/         ← CONTEÚDO de abertura por kind (sem arestas)
  closings/       ← CONTEÚDO de fecho por kind (sem arestas)
  deliberation/   ← q/r/d: question · research · decision + deliberation.yml (o mapa)
```

## Catálogo

**Intent — a camada ACIMA dos trabalhos**

| Molde        | Pra quê                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intent.yml` | o **objetivo durável**: dispara N trabalhos (tipos variados) + se **retroalimenta**; coração no nível do objetivo; **colapsa** no trabalho quando é simples |

**Abertura (do trabalho) — 1 template por tipo (`<kind>-brief.yml`), todos `node: work-brief`**

> Mesmo nó no grafo (abertura uniforme), forma sob medida por kind. Ao escolher o tipo, o molde já vem
> direcionado — e a pessoa logo percebe se escolheu o caminho errado.

| Molde                   | Abre          | Forma                                                         |
| ----------------------- | ------------- | ------------------------------------------------------------- |
| `delivery-brief.yml`    | `delivery`    | kernel + espinha + corpo (sealed)                             |
| `experiment-brief.yml`  | `experiment`  | kernel + ⊛ hipótese/métricas (sealed — pré-registro)          |
| `exploration-brief.yml` | `exploration` | kernel + ⊛ timebox; saída = a **resposta**                    |
| `incident-brief.yml`    | `incident`    | registro rápido (severidade + status) + bypass-com-prazo      |
| `fix-brief.yml`         | `fix`         | simples — sintoma (o usuário vê) → esperado → origem → pronto |
| `patch-brief.yml`       | `patch`       | simples — o-quê (invisível) → por quê → pronto                |

**Índice (projeção, não abertura)**

| Molde                | Pra quê                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `registry-entry.yml` | **schema BASE** da entrada de índice → crie `registry/<kind>.yml` (no repo) a partir dele (só os extras por kind).                     |
| `exploration.yml`    | template próprio do **registry da exploration** (diverge da base pela aresta **`answers`** + `fate`); o conteúdo vai pro brief/answer. |

**Deliberação (q/r/d) — pasta `deliberation/`**

| `question.md` · `research.md` · `decision.md` · `deliberation.yml` | a cadeia pergunta → investigação → decisão (+ o mapa append-only) |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |

**Estado**

| `state.yml` | SSOT estrutural (topologia + cursor de retomada) |
| ----------- | ------------------------------------------------ |

**Fecho (polimórfico por tipo)**

| Molde                    | Fecha                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| `experiment-outcome.md`  | o `experiment` (won/lost, **pós-merge**)                           |
| `exploration-answer.md`  | o `exploration` (a **resposta**; o código de POC **não** dá merge) |
| `incident-postmortem.md` | o `incident` (causa-raiz + prevenção, **pós-merge**)               |
| _(gate)_                 | o `delivery` — molde canônico em `.core/governance/templates`      |

**Ferramenta de intake (não é tipo)**

| `proposal.yml` | captura ideia/problema → triagem → promove/descarta → backlog |
| -------------- | ------------------------------------------------------------- |

## Mudanças desta rodada (vs antes)

- 🆕 **Camada `intent`** (`intent.yml`) acima dos trabalhos — o `node` dos briefs passou de `intent-brief` → `work-brief` (intent é a camada de cima; o que era "intent-brief" era só o `<kind>-brief`).
- 🔀 **Abertura = moldes** `<kind>-brief.yml` (todos `node: work-brief`) — aposentados `intent-brief.md`
  (genérico) e `incident.md` (bundle); `fix`/`patch` ganham brief próprio (não "abrem como registry" — isso era o
  pensamento Virtual, que caiu).
- ✂️ **`incident` separado em abertura × fechamento:** `incident-brief.md` (registro) + `incident-postmortem.md`
  (causa-raiz). Simétrico a experiment-outcome / exploration-answer.
- ✏️ **`registry-entry.yml`** reposicionado como **índice** (entrada de `registry/<kind>.yml`), não abertura.
- ✅ **Mantidos:** `question` · `research` · `decision` · `deliberation` _(ex-`decision-brief`)_ · `state` · `experiment-outcome` ·
  `exploration-answer` · `proposal`.
- 📁 **Reorg de pastas (referência ≠ conteúdo):** `registry-entry`/`proposal` subiram pra raiz; `briefs/` + `closings/` separam o **conteúdo por kind**; a pasta `registry/` saiu. **Briefs viraram conteúdo puro** — as arestas (`intent`, `closes-with`) migraram pro `registry`.
- 🔗 **Amarra intent↔exploration migrada (forma v2, validada na sim):** a **exploration** ancora a aresta **`answers: intent#qN`**; a intent **deriva** `answered-by`/`status`/`verdict` — **materializado no BANCO** (o `intent.yml` fica só INPUT); `contracts` viraram **uma lista** `[{name, awaits?}]` (known/pending derivado); **`unlocks` saiu** (o destrave é derivado). Novo `exploration.yml` (registry próprio); briefs/answers **referenciam** o id (`exploration: <id>`), não duplicam.

## Validação dos templates (tracker)

> Inventário dos **18 moldes**, **agrupado pela pasta** e **ordenado por status** (✅ → 🔶 → ❓) pra escanear rápido. **Confirmar 1 a 1** com a owner — o status é **leitura proposta** (rever detalhes é permitido mesmo nos ✅). Legenda: **✅** validado · **🔶** 1ª passada / parcial · **❓** não revisado (ou bloqueado por frente aberta).

### Raiz — estrutura / índice / referência

| Molde                | Status | Nota / o que falta confirmar                                                                                                                                                                                   |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intent.yml`         | ✅     | forma v2 ENXUTA: open-questions `{id, question}` (só INPUT) + contracts (lista `[{name, awaits?}]`) + objective/references/details. Derivados (`answered-by`/`status`/`verdict`/`breaks-into`) vivem no BANCO. |
| `registry-entry.yml` | ✅     | base + arestas agrupadas + status próprio + gerais (`intent`/`closed-at`/`closed-by`) + extras por kind (exploration → `fate`+**`answers`**).                                                                  |
| `exploration.yml`    | ✅     | registry próprio da exploration: base + **`answers`** (ancora a aresta) + `fate`; não fica "blocked" (bloqueio vira a resposta).                                                                               |
| `proposal.yml`       | ✅     | triagem (ICE) + owner + status EN.                                                                                                                                                                             |
| `state.yml`          | ❓     | **bloqueado pela Lente 2** (`stage: deciding \| executing` ainda aberto).                                                                                                                                      |

### `briefs/` — conteúdo de abertura (sem arestas)

| Molde                   | Status | Nota / o que falta confirmar                                                                                                               |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `delivery-brief.yml`    | ✅     | enxugado (`out-of-scope` · `done-when`); conteúdo puro.                                                                                    |
| `exploration-brief.yml` | ✅     | `question` (= open-question da intent) + timebox + approach/success-signal; **referencia o registry via `exploration:`** (não duplica id). |
| `experiment-brief.yml`  | 🔶     | falta rever ⊛ hipótese/métricas + `sealed`/pré-registro.                                                                                   |
| `incident-brief.yml`    | 🔶     | enums EN; ⚠️ tirar campos de ÍNDICE (`severity`/`status`/datas) → registry (frente do incident).                                           |
| `fix-brief.yml`         | 🔶     | confirmar sintoma→esperado→origem→pronto.                                                                                                  |
| `patch-brief.yml`       | 🔶     | confirmar o-quê→por quê→pronto.                                                                                                            |

### `closings/` — conteúdo de fecho (sem arestas)

| Molde                    | Status | Nota / o que falta confirmar                                                                  |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------- |
| `exploration-answer.md`  | ✅     | `verdict`/evidência/recomendação + `fate`; conteúdo puro (vínculo = `closed-by` do registry). |
| `experiment-outcome.md`  | 🔶     | won→`results-in`; ⚠️ ref `brief` stale + `outcome` duplicado (validação do experiment).       |
| `incident-postmortem.md` | ❓     | bloqueado pela **frente do incident**.                                                        |

### `deliberation/` — q/r/d (question · research · decision · deliberation)

| Molde              | Status | Nota / o que falta confirmar                                                                              |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------- |
| `question.md`      | 🔶     | vocab PT decidido; confirmar mode/opções/estado-iteração + relação com `open-questions` da intent.        |
| `decision.md`      | 🔶     | `grounded-by`→`supported-by` feito; resto não revisado.                                                   |
| `research.md`      | ❓     | não revisado nesta rodada.                                                                                |
| `deliberation.yml` | 🔶     | mapa VIVO append-only (decisão = nó · `decides`/`supported-by`/`spawns`/`supersedes`); ex-decision-brief. |

**Transversais (valem p/ vários):** `sealed` nos briefs · limiar de densidade (brief vs só registry) · a
**frente do incident** (bypass-com-prazo + alerta + postmortem). _(o "status por-kind no registry" já
fechou → enums em EN + status próprio derivado.)_

**Briefs = conteúdo puro** (sem arestas): `intent`/`closes-with` saíram pro `registry` (o índice é dono dos vínculos).
