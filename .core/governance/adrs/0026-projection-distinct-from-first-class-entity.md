# ADR 0026 — Distinguir projeção derivável de entidade de 1ª classe

**Status**: Aceita
**Origem histórica**: Spec 0024 (`context-architecture`). Lente capturada como research em 2026-05-30 (`research/2026-05-30-projection-vs-entity-lens.md`); acumulou ~14 instâncias sem graduar; promovida a `PIT-0009` em 2026-06-06 e graduada a este ADR após reincidência (capability-vs-affordance). Deliberação owner → ChatGPT → Claude.
**Relaciona-se com**:

- [`PIT-0009`](../../../.governance/runtime/insights.yml) — a percepção que este ADR cristaliza (graduada via `insight promote --to adr`).
- [`ADR 0018`](./0018-governance-first-ai-as-channel.md) (governança-first, AI-as-channel) — esta lente é o **inverso operacional** da identidade-raiz: se a raiz é a _transformação governada_ (mecanismo) e os objetos são projeções, o framework tende a ossificar projeções em pseudo-entidades.
- [`PIT-0008`](../../../.governance/runtime/insights.yml) / `research/2026-06-05-enforcement-surfaces.md` — lente irmã: **declaração ≠ enforcement** (onde um fato vive ≠ onde é imposto). Esta é sobre **derivável ≠ reificado**.
- [`CORE-15`](../../rules/top/agents-core.md) (ADR = princípio perene) — critério editorial deste registro.
- [`governance-foundation.md`](../../process/governance-foundation.md) § "Anti-padrões a rejeitar no review" (#7) — a projeção operacional desta lente para o review.

---

## Princípio

> **Antes de reificar algo como entidade, capability, estado persistido ou artefato governado de 1ª classe, perguntar: _isto é entidade de 1ª classe, ou projeção de algo mais fundamental já derivável (de topologia, port/adapter, consolidação, comando existente)?_ Reificar uma projeção como entidade introduz drift, cópias paralelas e sincronização manual. A separação só se justifica se produz simplificação operacional real; do contrário é renomeação.**

## Contexto

O modo de falha arquitetural **mais recorrente** da 0023/0024 não foi falta de captura de conhecimento — foi a tentação repetida de **ossificar uma projeção em pseudo-entidade**. O sintoma diagnóstico é constante: a projeção-tratada-como-entidade exige **sincronização manual entre cópias paralelas**, e toda evolução do mecanismo real deixa a cópia para trás (drift).

A lente foi capturada como research em 2026-05-30 com critério, contraexemplos e guard. Mas permaneceu em estado observacional (~14 instâncias) **sem graduar**, e por isso **não reapareceu** quando o mesmo erro recorreu — quase modelando `continue-other`/`publish-state-help` (affordances) como capabilities. Esse segundo defeito (conhecimento recorrente preso em research) foi corrigido em paralelo (detector de maturação no `insights:check`); este ADR cristaliza a **lente** em si.

## Decisão

1. **A lente é doutrina perene.** Toda proposta de **entidade / capability / Intent / estado persistido / artefato governado** novo passa pela pergunta: _entidade de 1ª classe ou projeção de algo derivável?_

2. **Critério decisivo — simplificação operacional.** Colapsar uma projeção na sua entidade-mãe (tratá-la como derivada, não declarada) só se justifica se **remove** drift, cópia paralela, sincronização manual ou decisão antecipada desnecessária. Se não remove nada disso, é **só renomear conceito** — fica como nota, não vira entidade nem decisão. (Espelha o critério que impede a 0024 de recair em debate ontológico interminável.)

3. **Guard anti-elegância (regresso finito).** A própria lente é sedutora: aplicada sem freio, **tudo** vira "projeção de algo mais fundamental" (regresso infinito). Por isso só sobe a candidato real quando há **(a)** sincronização-manual-recorrente observável **OU (b)** ≥2 instâncias do mesmo mecanismo subjacente. Não trocar uma elegância por outra.

4. **Mesma capability em duas superfícies NÃO é reificação.** Uma capability executável exposta tanto na superfície humana (wizard/Intent) quanto na CLI/IA (Command direto) é **legítima** — é projeção de UMA capability em dois canais, não duas entidades. Reificação é criar uma **representação persistida paralela** do que já é derivável, não oferecer duas portas para o mesmo mecanismo.

## Aplicações

Instâncias confirmadas (a lente **removeu** trabalho real — passam o critério §2):

- **Handoff** → projeção do contexto situado, não artefato primário (→ ADR 0022).
- **Taxonomia `deterministic/mixed/evidence-driven`** → projeção do crivo de pesquisa por bloco, não entidade (→ `[DEC-0024-G02]`).
- **`landing_policy` / vehicle-from-topology** → 3ª representação do que a topology já derivava; reificação falsificada (→ PIT-0008).
- **Disclosure → `participants.yml`/git-trailers** → rejeitado (autoria ≠ participação); disclosure é renderer/projeção, não entidade governada.
- **`confirmOrAbort`** → o deny-by-default já era single-sourced no port `Prompts.confirm`; helper de call-site era projeção redundante.
- **`continue-other` / `publish-state-help`** → affordances humanas de `continue <id>`/`publish-state` (mesma capability, 2 superfícies — §4), não capabilities novas.
- **`integration-open` / `merge-stack`** (falsificação 2026-06-06) → **passos do rito de encerramento** (operações do `workflow`, "wizard option 4/5" por design em `[DEC-0023-L01]`), não capabilities de 1ª classe. Single-homed (único invocador: `workflow.ts`); promovê-las a Command **não removeria drift** → reificação. A "pendência de convergência do #35" era ela própria uma projeção reificada (meta-instância desta lente).

## Alternativas avaliadas e rejeitadas

| Opção                                                                     | Por que rejeitada                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manter a lente só como research-collector** (status quo até 2026-06-06) | É o próprio modo de falha "observar para sempre": conhecimento recorrente preso em research nunca reaparece. A barra da própria lente (≥2 instâncias) foi batida ~5×.                                                                                                                                   |
| **Auto-promover/auto-aplicar a lente por contagem mecânica**              | Reificar a lente em automação que decide sozinha viola julgamento humano no gate (ADR 0021) e a própria lente (criar uma capability onde basta uma heurística).                                                                                                                                         |
| **Codificar a nuance na injeção universal (regra compilada)**             | Nuance reference-grade pertence ao ADR; a injeção carrega só pointer (ADR 0015 + higiene de injeção + orçamento). A projeção operacional vai ao `governance-foundation`.                                                                                                                                |
| **Tratar como guardrail mecânico (check)**                                | A lente é heurística de **julgamento** ("remove simplificação operacional?"), não predicado mecânico; quem a aplica é o **agente** (percebe + sugere, AI-as-channel/ADR 0018), não um check determinístico — o runtime é lookup, sem LLM (ADR 0018). Não por proibir inferência; por ela ser do agente. |

## Consequências

### Positivas

- O modo de falha #1 da 0023/0024 ganha nome, critério e casa perene — verificável em todo design de entidade.
- Single-sourced: a lente vive como ADR (perene) + `PIT-0009` (caminho de reaparecimento) + anti-padrão #7 (review). Para de ser redescoberta.

### Negativas / Riscos

- A lente é sedutora (regresso infinito) — o guard §3 é parte da decisão, não opcional.
- O salto **percepção → reconhecimento no momento certo** é **do agente** — perceber padrão abstrato é o valor do AI-as-channel (ADR 0018), não um mecanismo determinístico do runtime; por isso não é _garantia_ mecânica, e isso é correto. Não confundir com proibição: `[DEC-0023-B06]` veta inferência **no wizard/runtime** (lookup-only), não a sugestão do agente; o gate é na **decisão** (ADR 0021), não na percepção. O ADR + o PIT + o anti-padrão + a captura proativa **aumentam a probabilidade** do reaparecimento.

## Nota histórica

A lente nasceu da instrução da owner em 2026-05-30 ("usar a lente explicitamente; primeiro quero enxergar o padrão completo; não auto-absorver"). Essa disciplina (observar antes de cristalizar) — correta em si — sem um gatilho de reavaliação virou "observar para sempre": a lente acumulou ~14 instâncias sem graduar e falhou em reaparecer na reincidência de 2026-06-06. A correção foi dupla: o **detector de maturação** (`insights:check` sinaliza PIT recorrente não-graduado) fechou o ciclo `PIT → graduação`, e este ADR fecha `research → doutrina` para esta lente específica.
