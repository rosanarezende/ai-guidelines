---
node: intent-brief
kind: spike
sealed: true
---

# Intent — qual lib OAuth no backend?

## Kernel

- **Pretendemos:** escolher a lib OAuth
- **Fazendo:** PoC com 2 candidatas
- **Saberemos por:** uma bater os critérios (manutenção, tipos, refresh)
- **Pronto quando:** houver recomendação

## Corpo (`kind: spike`)

- **Pergunta a responder:** qual lib cobre authorize/callback/refresh com menos código e boa manutenção?
- **Timebox:** 1 dia.
- **Decisão que destrava:** a lib de `deliv-001`.
- **Critério de "sabemos o suficiente":** 2 libs testadas nos 3 critérios.
- **Saída esperada:** recomendação (não implementação).

> Fecha com `learning-record` (a resposta) → **resolve** a decisão de `deliv-001`.
