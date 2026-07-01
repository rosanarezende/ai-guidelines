---
node: intent-brief
kind: spike
sealed: true
---

# Intent — cabe um graph store derivado?

## Kernel

- **Pretendemos:** saber se um graph store derivado vale a pena
- **Fazendo:** um PoC de 1 dia
- **Saberemos por:** uma query que JSON não atende
- **Pronto quando:** houver recomendação

## Corpo (`kind: spike`)

- **Pergunta a responder:** existe consulta real (multi-hop) que o snapshot JSON não resolve bem?
- **Timebox:** 1 dia
- **Decisão que isto destrava:** se o `internal-refactor` precisa de adapter de banco
- **Critério de "sabemos o suficiente":** 3 queries-alvo testadas em JSON × grafo
- **Saída esperada:** recomendação (adotar / adiar / descartar) — **não** implementação

> Fecha com `learning-record` (a resposta); pode ser aberto para resolver um `finding` de uma `delivery`.
