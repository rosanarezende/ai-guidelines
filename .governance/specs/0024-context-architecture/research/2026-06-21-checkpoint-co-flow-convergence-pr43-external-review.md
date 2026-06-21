# Revisao externa pre-Human Gate — PR #43 / CO-10.1..CO-10.7

Data: 2026-06-21
Origem: revisao externa independente solicitada por Rosana antes de Ready/Human Gate do PR #43
Escopo revisado: branch `feat/spec-0024-co-flow-convergence`, PR #43, recorte CO-10.1..CO-10.7

## Veredito

O recorte CO-10.1..CO-10.7 e coerente e entrega valor real sem depender da implementacao de CO-10.8..CO-10.10. O PR #43 ainda nao deve ir para Ready/Human Gate antes de fechar correcoes de honestidade documental/topologica.

## Evidencias principais

- PR #43 permanece Draft e aberto.
- Gate do no `co-flow-convergence` ainda nao existe, portanto Human Gate nao foi executado.
- `tasks.md` recorta CO-10.1..CO-10.7 como entregue e move CO-10.8..CO-10.10 para proximo PR.
- `review:check` nao encontrou findings abertos no checkpoint.
- `pr-ready:check --pr 43` ainda bloqueava Ready porque o body do PR nao descrevia o valor entregue real.
- CI do PR estava verde nos checks principais, com smoke real/multi-OS diferido por politica de PR intermediario.

## Achados

### EXT-01 — Body do PR desatualizado

O body do PR ainda descrevia majoritariamente CO-10.1 e nao comunicava a entrega real ate CO-10.7. Isso bloqueia Ready pelo contrato do proprio repositorio.

Correcao esperada: reescrever o body com o recorte real, valor entregue, evidencias, limites e disclosure.

### EXT-02 — `state.yml § next` stale

O `next` ainda dizia que CO-10.7 foi reaberto antes de retomar CO-10.8, sem refletir o recorte G19 nem a revisao externa. Uma retomada nova poderia apontar para o movimento errado.

Correcao esperada: reconciliar `next` para o estado atual do PR #43 e sua continuacao.

### EXT-03 — Continuacao CO-10.8..CO-10.10 sem no topologico

CO-10.8..CO-10.10 estavam em prosa como proximo PR, mas nao apareciam em `state.yml § topology`. A topologia iria de `co-flow-convergence` direto para `dualroot-collapse`, o que deixaria indefinido o proximo movimento do Human Gate.

Correcao esperada: materializar a continuacao em no planejado antes de `dualroot-collapse`, `co-capture` e `co-events`.

### EXT-04 — Reviews formais cobrem inventario, nao toda a superficie entregue

Os reviews formais de technical audit, architectural review e security review do no foram feitos sobre o inventario CO-10.1. A superficie final entregue ate CO-10.7 foi validada por dogfood, harnesses e esta revisao externa.

Correcao esperada: declarar esse limite no body/Gate e agendar nova rodada formal para a continuacao.

### EXT-05 — Smoke real diferido

O smoke real/multi-OS continua diferido por politica de PR intermediario. O harness de consumidor local cobre a entrega atual, mas o fechamento futuro deve reativar o smoke real.

Correcao esperada: explicitar a diferenca entre prova local deste PR e smoke obrigatorio futuro.

### EXT-06 — `research/` misturando status, pesquisa e backlog

Os artefatos de `research/` cresceram como deposito misto. Isso nao bloqueia o PR #43, mas deve ser tratado no proximo PR para reduzir ambiguidade de retomada.

Correcao esperada: triagem de artefatos de pesquisa/status/backlog na continuacao.

## Decisao resultante

Rosana autorizou tratar EXT-01, EXT-02 e EXT-03 antes de Ready. A decisao governada correspondente e `[DEC-0024-G20]`: ancorar CO-10.8..CO-10.10 no no planejado `co-flow-continuation`, reconciliar `state.yml § next` e atualizar o body do PR #43.

## Fronteira

Esta revisao nao executa Ready, Human Gate, merge, readiness, `advance-subcheckpoint`, abertura de novo PR nem implementacao de CO-10.8. Ela e evidencia para decidir se o recorte do PR #43 pode seguir para Ready apos as correcoes pre-Gate.
