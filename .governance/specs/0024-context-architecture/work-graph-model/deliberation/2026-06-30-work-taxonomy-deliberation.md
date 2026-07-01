# Deliberação — a TAXONOMIA do trabalho: famílias + dimensões ortogonais (supersede os "5 tipos") — q/r/d

- Data: 2026-06-30 · Spec 0024 · Natureza: **deliberação, não-autoridade** (base do `tracker.md` v2).
- Org fictícia ANONIMIZADA (`acme-*`). Nenhum nome/fonte confidencial versionado.
- **GATE (owner, 2026-06-30):** aprovada (incident-resposta + experiment-aprendizado + fix/patch→maintenance + dimensões). Vira as **Lentes 3 e 4** do tracker v2.

---

## O problema

Os **5 tipos MECE por intenção de saída** (delivery/experiment/incident/fix/patch) misturam três coisas distintas: o **tipo** (o que produz), a **origem/reatividade** e a **classe de serviço**. Isso quebra cedo: "reativo" vira propriedade do tipo; `incident` fica raso (status genérico); `experiment` é tratado como entrega comum; `fix`/`patch` só se distinguem por "o usuário vê". A pergunta: **os 5 moram todos na mesma categoria "trabalho"?**

## Researches (o embasamento)

- **2 rodadas de auditoria adversarial** (agente revisor externo, na sim) + o **teste do próprio modelo** (Lente 4: _TRABALHO = entrega valor de PRODUTO_).
- **Prior art pública:** dual-track agile / discovery×delivery (SVPG, Patton) · taxonomia de manutenção de software **ISO/IEC/IEEE 14764** (corretiva/adaptativa/perfectiva/preventiva) · change management **ITIL** (standard/normal/emergency) · **Kanban** classes of service + work-item-type × workflow × class-of-service · plataformas de experimentação (flags/métricas/guardrails/cleanup) · catálogo **Backstage** · incident mgmt (Google SRE / severidade).
- **Achado central:** o padrão saudável é **menos TIPOS, mais DIMENSÕES ortogonais** — mas com **enforcement** (cada dimensão tem que afetar workflow/lint/dashboard, senão vira tag decorativa) e **presets** humanos (a UX não pode virar um seletor-de-dimensões).

## Decisões (aprovadas)

- **D1 — `incident` sai de "trabalho": vira RESPOSTA (instrumento reativo, ciclo próprio).** Falha no teste "entrega valor de produto?" (o valor dele é **contenção + não-repetir**; o valor de produto vem do que ele **gera**). É disparado por **evento/severidade** (não planejado), tem lifecycle **declarar→mitigar→resolver→postmortem**, e **gera** `fix`/`maintenance`/`delivery`/`proposal`. **Não é filho de breakdown planejado** — liga-se por `occurred-during`/`caused-by`/`related-to`.
- **D2 — `experiment` sai de "trabalho": vira APRENDIZADO (instrumento executável que shippa).** Mesmo teste: o output **direto** é **aprendizado** (won/lost/inconclusive), não capacidade comprometida (essa só vem no **won → delivery**). É irmão da `exploration` (ambos reduzem incerteza; a exploration investiga sem shippar, o experiment aprende shippando). Exige **lifecycle operacional**: flag · exposição · métrica · guardrail · decision-rule · **cleanup**.
- **D3 — `fix` + `patch` colapsam em `maintenance`** (preserva/restaura/adapta capacidade existente). O discriminador "o usuário vê" era fraco → vira **dimensão**. `fix`/`patch` viram **presets** (UX/alias), não ontologia.
- **D4 — `source` é um eixo ORTOGONAL universal:** `planned | reactive`. Vale pro trabalho (`maintenance` pode ser planned ou reactive) **e** pros instrumentos (`proposal` proativo / `incident` reativo). "Reativo" deixa de ser tipo.
- **D5 — as DIMENSÕES ortogonais** (cortam as famílias; cada uma com semântica operacional + lint, senão não entra):
  - `source`: planned · reactive
  - `visibility`: user-visible · internal · operator-visible · security-visible
  - `maintenance-mode`: corrective · adaptive · perfective · preventive _(só maintenance — ISO 14764)_
  - `change-class`: standard · normal · emergency _(ITIL)_
  - `service-class`: expedite · fixed-date · standard · intangible _(Kanban)_
  - `planned-in`: a intent (se houver)
- **D6 — as FAMÍLIAS** (por natureza da saída; supersede "5 tipos MECE" — recência vence):

  | família         | produz                                     | membros                                                      |
  | --------------- | ------------------------------------------ | ------------------------------------------------------------ |
  | **CAPACIDADE**  | valor de produto (cria/mantém capacidade)  | `delivery` (cria) · `maintenance` (preserva/restaura/adapta) |
  | **APRENDIZADO** | conhecimento (reduz incerteza; executável) | `exploration` · `experiment`                                 |
  | **RESPOSTA**    | contenção reativa                          | `incident`                                                   |
  | **INTAKE**      | captura + triagem                          | `proposal` · `register`                                      |
  | **DELIBERAÇÃO** | o raciocínio                               | `question` · `research` · `decision`                         |

- **D7 — presets humanos (UX, não ontologia):** "fix" = `maintenance+corrective+user-visible` · "security patch" = `maintenance+corrective+security-visible` · "bump de dep" = `maintenance+adaptive+internal`.
- **D8 — princípio: modelar TODOS os fluxos.** Um framework de governança prevê todos os fluxos (capacidade/SLA/release-rollback/SLO/incident-lifecycle…). O que se **faseia** é a **implementação** (via `features.md`), não o modelo. Nada fica "fora por escala".

## O que muda no breakdown (fecha o 🔶 do incidente)

`breakdown` planejado de uma intent gera: **`delivery`** (sempre) · **`maintenance`** (quando habilitador/estabilização; com `source=planned`) · e dispara **`exploration`/`experiment`** (aprendizado) quando há incerteza/hipótese. **`incident` nunca sai do breakdown** (é resposta reativa). `experiment` won → `delivery`.

## Resíduo / a estressar

- O **enforcement** de cada dimensão (lint/workflow/dashboard) — vai pro `features.md`.
- `maintenance` virar buraco negro → mitigar com `maintenance-mode` + `reason` obrigatórios.
- `experiment` sem cleanup → flags/variantes mortas (guardrail no `experiment` lifecycle).
- Onde "menos tipos + mais dimensões" **atrapalha** a UX humana → os presets resolvem; revisitar na sim.
