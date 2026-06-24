# Dogfood controlado — modelo de fluxo (G25)

> **Ambiente controlado, não-autoridade.** Instancia o modelo de fluxo
> (`research/2026-06-24-governed-work-flow-model.md`) como **arquivos-nó com arestas em frontmatter**,
> usando como exemplo **o próprio trabalho que produziu a G25**. Objetivo: ver **como
> `intent`/`question`/`research`/`decision` se distribuem** e validar que **uma DEC resolve MÚLTIPLAS
> questions**.

## Distribuição (a pergunta "como distribuiríamos")

```
_flow-model-dogfood/
  intent-brief.md            ← abertura SELADA (kernel + requisitos); NÃO lista questions
  questions/
    q01-opening-artifact.md    ← 1 pergunta; `raised-by` intent · `investigated-by` research · `resolves-into` §Dx
    q02-naming.md
    …                          ← (seed: 2 de ~8, p/ validar a forma)
  decision/
    dec-g25.md               ← `resolves` o bundle de questions; `body` aponta a consolidação
```

## Por que `question` (não `finding`)

`finding` privilegia o **fim** (conclusão); o nó é **interrogativo** enquanto aberto. `question` é
honesto e pareia canônico com `research` (_"research question"_). Lifecycle: `aberta → resolvida`.

## Arestas (em frontmatter, como DADO — não prosa)

`raised-by` (question→intent) · `investigated-by` (question→research) · `resolves-into` (question→§Dx) ·
`resolves` (decision→questions) · `grounded-by` (decision→research) · `body` (decision→consolidação).

**A aresta mora na `question`** (`raised-by`), **não** no intent (`raises`): o `intent-brief` fica
**selado** e não cresce quando uma question nova nasce. "Questions deste intent" = **view derivada**
(query `questions where raised-by = intent-brief`).

→ Lendo só os frontmatters, um agente **deriva o grafo** `intent → question → research → decision` sem
ler uma linha de prosa. É a tese "modelagem como indexação" **executável**, em miniatura.
