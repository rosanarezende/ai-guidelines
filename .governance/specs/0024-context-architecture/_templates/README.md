# \_templates — os moldes do modelo (6 tipos + a ferramenta de intake), adaptados às 3 lentes

> Coletânea **canônica** dos moldes, adaptada às decisões do `research/2026-06-25-work-graph-model.md`.
> Não-autoridade (o template vivo real, pós-DEC, vai para `.core/governance/templates/`).

## Catálogo

**Abertura — 1 template por tipo (`<kind>-brief.md`), todos `node: intent-brief`**

> Mesmo nó no grafo (abertura uniforme), forma sob medida por kind. Ao escolher o tipo, o molde já vem
> direcionado — e a pessoa logo percebe se escolheu o caminho errado.

| Molde                 | Abre         | Forma                                                         |
| --------------------- | ------------ | ------------------------------------------------------------- |
| `delivery-brief.md`   | `delivery`   | kernel + espinha + corpo (sealed)                             |
| `experiment-brief.md` | `experiment` | kernel + ⊛ hipótese/métricas (sealed — pré-registro)          |
| `spike-brief.md`      | `spike`      | kernel + ⊛ timebox; saída = a **resposta**                    |
| `incident-brief.md`   | `incident`   | registro rápido (severidade + status) + bypass-com-prazo      |
| `fix-brief.md`        | `fix`        | simples — sintoma (o usuário vê) → esperado → origem → pronto |
| `patch-brief.md`      | `patch`      | simples — o-quê (invisível) → por quê → pronto                |

**Índice (projeção, não abertura)**

| `registry-entry.yml` | schema de uma entrada do índice **per-kind** `registry/<kind>.yml` (→ active-work). Todo trabalho ganha uma. |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |

**Investigação / Decisão**

| `question.md` · `research.md` · `decision.md` · `decision-brief.yml` | a cadeia pergunta → investigação → decisão (+ índice derivado) |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |

**Estado**

| `state.yml` | SSOT estrutural (topologia + cursor de retomada) |
| ----------- | ------------------------------------------------ |

**Fecho (polimórfico por tipo)**

| Molde                    | Fecha                                                         |
| ------------------------ | ------------------------------------------------------------- |
| `experiment-outcome.md`  | o `experiment` (won/lost, **pós-merge**)                      |
| `spike-answer.md`        | o `spike` (a **resposta**; o código de POC **não** dá merge)  |
| `incident-postmortem.md` | o `incident` (causa-raiz + prevenção, **pós-merge**)          |
| _(gate)_                 | o `delivery` — molde canônico em `.core/governance/templates` |

**Ferramenta de intake (não é tipo)**

| `proposal.yml` | captura ideia/problema → triagem → promove/descarta → backlog |
| -------------- | ------------------------------------------------------------- |

## Mudanças desta rodada (vs antes)

- 🔀 **Abertura virou 6 moldes** `<kind>-brief.md` (todos `node: intent-brief`) — aposentados `intent-brief.md`
  (genérico) e `incident.md` (bundle); `fix`/`patch` ganham brief próprio (não "abrem como registry" — isso era o
  pensamento Virtual, que caiu).
- ✂️ **`incident` separado em abertura × fechamento:** `incident-brief.md` (registro) + `incident-postmortem.md`
  (causa-raiz). Simétrico a experiment-outcome / spike-answer.
- ✏️ **`registry-entry.yml`** reposicionado como **índice** (entrada de `registry/<kind>.yml`), não abertura.
- ✅ **Mantidos:** `question` · `research` · `decision` · `decision-brief` · `state` · `experiment-outcome` ·
  `spike-answer` · `proposal`.

> ⚠️ Em aberto (iterar): `sealed` nos briefs · limiar densidade (brief vs só registry) · status por-kind no
> registry · mecanismo do bypass-com-prazo + alerta do postmortem (frente do incident).
