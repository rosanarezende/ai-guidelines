# Dogfood controlado — modelo de fluxo (G25)

> **Ambiente controlado, não-autoridade, NÃO commitado durante o refino.** Instancia o modelo de fluxo
> como **arquivos-nó com arestas em frontmatter**, naming `q-NNN_`/`res-NNN_`/`dec-NNN_`. Valida a
> distribuição, a **iteração incremental**, o **gate humano** (opções neutras → recomendação → escolha),
> e a **retomada específica**.

> ⚠️ **Supersedido em parte (2026-06-24):** o modelo Virtual aqui (`_TEMPLATE.intent-inline.md` e
> `_examples-by-kind/virtual-inline.md` — _"inline no PR"_) **regrediu contra o `intent-brief` research §7(b)**
> (GitHub não é fonte; o repo é). A forma correta (**`registry.yml` versionado**) + a falsificação dos templates
> por kind vivem agora em `../_repo-simulation/` (grounding:
> `research/2026-06-24-opening-artifact-by-kind-and-repo-simulation.md`). Este dogfood fica como **histórico**.

## Distribuição

```
_flow-model-dogfood/
  intent-brief.md     + _TEMPLATE.intent-brief.md     ← raiz; abertura SELADA (kernel + requisitos)
  state.yml           + _TEMPLATE.state.yml           ← SSOT estrutural (progresso + cursor de retomada)
  decision-brief.yml  + _TEMPLATE.decision-brief.yml  ← VIEW DERIVADA das decisions (YAML, não à mão)
  _TEMPLATE.learning-record.md                        ← fechamento de experiment/spike (delivery fecha no gate)
  questions/  _TEMPLATE · q-001..q-008 (§D1..§D8) · q-009 (§D9 — retomada, nascida no trabalho) — todas resolvidas
  research/   _TEMPLATE · res-001 (naming/abertura) · res-002 (cadeia/7-tipos/hierarquia/fechamento/pausa)
  decisions/  _TEMPLATE · dec-001 (bundle de 9, partial)
  _TEMPLATE.intent-inline.md                          ← Virtual (proposal/patch/fix): intent inline, sem arquivo
  _examples-by-kind/  experiment · spike · incident · virtual-inline · learning-record(experiment-won)
```

> **Os 8 pontos da G25 são `q-001..q-008` (→ §D1..§D8)** — o dogfood tinha que **trazer os 8**, não 2. A
> pergunta de **retomada** (`q-009`) **nasceu durante o trabalho** (`raised-by: tarefa`) → é o **9º**, não um
> dos 8. Bundle de `dec-001` cresceu 8→9 append-only (o que o modelo §6 prevê).

`decisions/`/`questions/` plural (contável); `research/` singular (incontável). `intent-brief`/`state`/
`decision-brief` são únicos por trabalho (sem NNN), na raiz. **Derivado = YAML** (`state`, `decision-brief`);
**autorado = Markdown** (intent/question/research/decision).

## Retomada específica — `cursor` + sub-estado (teu ponto 3)

O `cursor` sozinho diz só QUAL nó. Para a retomada dizer **ONDE estávamos**, refinamos:

- **`state.cursor`** = `node` (q-003) **+ `note`** (o sub-ponto, 1 linha);
- a **`question` aberta** carrega **"Estado da iteração"** (o que convergiu / o que falta NAQUELA question).

→ Retomar = ler `state.cursor` → abrir o nó → ver detalhe + opções vivas. **Específico, não genérico.**
Foi assim que `q-009` se resolveu (B+C → §D9); agora o cursor aponta `dec-001` (_9/9, aguardando crave_).

## Iteração incremental (teu adendo)

Cada **open point = uma `question`**; a `decision` acretua `draft → partial → resolved`; o
`decision-brief.yml` mostra `progress: k/N` **derivado** de `dec-001.resolves` (`into` preenchido = resolved ·
`into: null` = open). Hoje `dec-001` está `resolved`, **`9/9`** (§D1–§D9 ✓; `q-009` validada B+C). `owner`/`date`
seguem `null` = **aguardando crave** (Human Gate) — o eixo Autoridade, separado do conteúdo já convergido.

## Gate humano, sem enviesar

| Peça                                                                                       | Mora em    |
| ------------------------------------------------------------------------------------------ | ---------- |
| **Opções** (Problema·Benefícios·Tradeoffs·Riscos·Quando·Quando NÃO — **nunca Pró/Contra**) | `question` |
| **Recomendação** (bounded, só `escolha`)                                                   | `research` |
| **Escolha + Justificativa + Owner/Data**                                                   | `decision` |

> Formato: partials `05-phase-0-brief` + `06-phase-0-gate`; rationale `governance-foundation § Contrato da cadeia` + ADR 0018/0021.

## Regra de aresta: cada nó declara só suas DEPENDÊNCIAS (back-pointers)

`question → raised-by` · `research → investigates` · `decision → resolves (q→§Dx) · grounded-by · body`.
Tudo "forward" (intent→questions, question→research/decision) é **view derivada**. Lê-se o frontmatter → deriva-se o grafo.

**A+ (links gerados):** para legibilidade standalone, a `question` materializa `investigated-by`/`resolved-by`
no frontmatter — mas **gerados** dos back-pointers (não à mão), com um check garantindo que batem. Fonte
única (sem drift) + arquivo auto-explicativo. Ver `q-001` (gerado) × `q-003` (aberta, ainda vazio).

## Decidido nesta rodada

- **O bundle traz os 8 pontos da G25** (`q-001..q-008 → §D1..§D8`); a retomada virou **`q-009`** (9º, nascido
  no trabalho), não `q-003`. **q-009 validada B+C → §D9 → `dec-001` `resolved` 9/9** (aguardando crave). ✓
- **Dois eixos no fecho da própria DEC** (§D6 aplicado a si): `status: resolved` = conteúdo convergido ·
  `owner/date null` = ainda não cravada (Human Gate é ato humano separado). ✓
- **`decision-brief.yml` agora é REALMENTE derivável** de `dec-001.resolves` (`into` vs `null`) — sem o índice
  `2/8` hand-authored de antes. ✓
- **`learning-record`** ganhou template + exemplo (experiment `won` → `promotes-to` delivery). ✓
- **`decision-brief` = YAML derivado** (igual `state`; derivado não se autora à mão). ✓
- **`state`: `spec:` → `work:`** (+ `kind`); referências de conteúdo a `spec.md`/`spec→delivery` (q-001/q-002/res-001) são **legítimas** (falam do rename).
- **id de decisão = `dec-NNN`** (sequencial; sem série `G` no id). ✓
- **arestas forward na question = A+ (geradas, não à mão)** — legibilidade sem drift. ✓
- **`state` sem `open-decision`** — decisões abertas são derivadas (`decision-brief.yml`; podem ser 0/1/N); `state` guarda só o `cursor` (foco único). ✓
