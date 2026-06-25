# \_templates — os moldes do modelo (6 tipos + a ferramenta de intake), adaptados às 3 lentes

> Coletânea **canônica** dos moldes, adaptada às decisões do `research/2026-06-25-work-graph-model.md`.
> Não-autoridade (o template vivo real, pós-DEC, vai para `.core/governance/templates/`).

## Catálogo

**Abertura**

| Molde                | Pra quê                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| `intent-brief.md`    | abre `delivery`/`experiment`/`spike` (sealed por-kind; **densidade por instância**)   |
| `incident.md`        | abre `incident` (registro rápido + bypass-com-prazo + postmortem leve; **blameless**) |
| `registry-entry.yml` | índice leve de **qualquer** trabalho (→ active-work); `fix`/`patch` abrem assim       |

**Investigação / Decisão**

| `question.md` · `research.md` · `decision.md` · `decision-brief.yml` | a cadeia pergunta → investigação → decisão (+ índice derivado) |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |

**Estado**

| `state.yml` | SSOT estrutural (topologia + cursor de retomada) |
| ----------- | ------------------------------------------------ |

**Fecho (polimórfico por tipo)**

| Molde                   | Fecha                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `experiment-outcome.md` | o `experiment` (won/lost, **pós-merge**)                      |
| `spike-answer.md`       | o `spike` (a **resposta**; o código de POC **não** dá merge)  |
| _(postmortem)_          | o `incident` — dentro do `incident.md` (doc vivo)             |
| _(gate)_                | o `delivery` — molde canônico em `.core/governance/templates` |

**Ferramenta de intake (não é tipo)**

| `proposal.yml` | captura ideia/problema → triagem → promove/descarta → backlog |
| -------------- | ------------------------------------------------------------- |

## Mudanças desta rodada (vs antes)

- ❌ **Removidos:** `intent-inline.md` (Dense/Virtual caiu) · `learning-record.md` (split em experiment-outcome × spike-answer).
- 🆕 **Criados:** `incident.md` · `proposal.yml` · `experiment-outcome.md` · `spike-answer.md`.
- ✏️ **Adaptados:** `intent-brief.md` (6 tipos; sealed por-kind; densidade por instância) · `registry-entry.yml` (sem Dense/Virtual).
- ✅ **Mantidos:** `question` · `research` · `decision` · `decision-brief` · `state`.

> Validados contra os exemplos em `../_repo-simulation/`; o que não encaixar, ajusta-se aqui.
