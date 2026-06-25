# Dogfood controlado — modelo de fluxo (G25)

> **Ambiente controlado, não-autoridade, NÃO commitado durante o refino.** Instancia o modelo de fluxo
> como **arquivos-nó com arestas em frontmatter**, naming `q-NNN_`/`res-NNN_`/`dec-NNN_`. Valida a
> distribuição, a **iteração incremental**, o **gate humano** (opções neutras → recomendação → escolha),
> e a **retomada específica**.

## Distribuição

```
_flow-model-dogfood/
  intent-brief.md     + _TEMPLATE.intent-brief.md     ← raiz; abertura SELADA (kernel + requisitos)
  state.yml           + _TEMPLATE.state.yml           ← SSOT estrutural (progresso + cursor de retomada)
  decision-brief.yml  + _TEMPLATE.decision-brief.yml  ← VIEW DERIVADA das decisions (YAML, não à mão)
  questions/  _TEMPLATE · q-001 · q-002 (resolvidas) · q-003 (ABERTA)
  research/   _TEMPLATE · res-001
  decisions/  _TEMPLATE · dec-001
  _TEMPLATE.intent-inline.md                          ← Virtual (proposal/patch/fix): intent inline, sem arquivo
  _examples-by-kind/  experiment · spike · incident · virtual-inline   ← corpo polimórfico vivo por kind
```

`decisions/`/`questions/` plural (contável); `research/` singular (incontável). `intent-brief`/`state`/
`decision-brief` são únicos por trabalho (sem NNN), na raiz. **Derivado = YAML** (`state`, `decision-brief`);
**autorado = Markdown** (intent/question/research/decision).

## Retomada específica — `cursor` + sub-estado (teu ponto 3)

O `cursor` sozinho diz só QUAL nó. Para a retomada dizer **ONDE estávamos**, refinamos:

- **`state.cursor`** = `node` (q-003) **+ `note`** (o sub-ponto, 1 linha);
- a **`question` aberta** carrega **"Estado da iteração"** (o que convergiu / o que falta NAQUELA question).

→ Retomar = ler `state.cursor` (_"q-003 · decidindo como a retomada mostra o sub-ponto"_) → abrir `q-003`
→ ver as opções vivas + o estado atual. **Específico, não genérico.** (Ver `state.yml` + `q-003`.)

## Iteração incremental (teu adendo)

Cada **open point = uma `question`**; a `decision` acretua `draft → partial → resolved`; o
`decision-brief.yml` mostra `progress: k/N`. Hoje `dec-001` está `draft`, `2/8` (q-001/q-002 ✓, q-003
ABERTA = onde estamos). É a lista §9 de antes, **derivada e rastreável**.

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

- **`decision-brief` = YAML derivado** (igual `state`; derivado não se autora à mão). ✓
- **`state`: `spec:` → `work:`** (+ `kind`); referências de conteúdo a `spec.md`/`spec→delivery` (q-001/q-002/res-001) são **legítimas** (falam do rename).
- **id de decisão = `dec-NNN`** (sequencial; sem série `G` no id). ✓
- **arestas forward na question = A+ (geradas, não à mão)** — legibilidade sem drift. ✓
- **`state` sem `open-decision`** — decisões abertas são derivadas (`decision-brief.yml`; podem ser 0/1/N); `state` guarda só o `cursor` (foco único). ✓
