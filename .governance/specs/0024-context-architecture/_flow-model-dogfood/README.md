# Dogfood controlado — modelo de fluxo (G25)

> **Ambiente controlado, não-autoridade.** Instancia o modelo de fluxo
> (`research/2026-06-24-governed-work-flow-model.md`) como **arquivos-nó com arestas em
> frontmatter**, usando como exemplo **o próprio trabalho que produziu a G25** — o teste mais honesto:
> o modelo representando a **própria criação**. Objetivo: ver **como `intent`/`finding`/`research`/
> `decision` se distribuem** e validar que **uma DEC resolve MÚLTIPLOS findings**.

## Distribuição (a pergunta "como distribuiríamos")

```
_flow-model-dogfood/
  intent-brief.md          ← abre; `raises` os findings
  findings/
    f01-opening-artifact.md  ← 1 pergunta; `investigated-by` research; `resolves-into` §Dx da DEC
    f02-naming.md
    …                        ← (seed: 2 de ~8, p/ validar a forma antes de expandir)
  decision/
    dec-g25.md             ← `resolves` os findings (bundle); `body` aponta a consolidação
```

## Arestas (em frontmatter, como DADO — não prosa)

`raises` (intent→finding) · `investigated-by` (finding→research) · `resolves-into` (finding→§Dx) ·
`resolves` (decision→findings) · `grounded-by` (decision→research) · `body` (decision→consolidação).

→ Lendo só os frontmatters, um agente **deriva o grafo** intent→finding→research→decision sem ler prosa.
É a tese "modelagem como indexação" **executável**, em miniatura.
