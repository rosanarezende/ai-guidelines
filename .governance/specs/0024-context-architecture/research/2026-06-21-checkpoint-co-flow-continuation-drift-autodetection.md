# CO-10.8.1 — autodetecção de drift no fluxo humano

Data: 2026-06-21
Spec: 0024 — context-architecture
Checkpoint: checkpoint-co-flow-continuation
PR: #44 — co-flow-continuation

## Problema observado

O primeiro reparo seguro de drift mostrou valor, mas também revelou um limite de produto:
se o humano ou a LLM precisa lembrar de rodar `drift` periodicamente, o framework ainda
exige conhecimento interno demais.

O objetivo desta fatia é transformar drift em preflight automático: o framework deve
detectar e explicar incoerências antes de orientar trabalho diário, validação ou decisão
sensível.

## O que foi implementado

- Novo módulo `governancePreflight`, derivado do `GovernanceDoctor`.
- Novo locale `governancePreflight.json`, mantendo textos operacionais fora do código.
- Entrada sem comando (`npx ai-guidelines` / `npm run flow`) renderiza preflight quando há drift.
- `work` renderiza preflight antes do briefing de trabalho.
- `decide` bloqueia decisões mutantes quando há drift; `--brief-only` continua permitido.
- `drift --check` vira modo read-only bloqueante para hooks e validações.
- `validate:changed` passa a chamar `drift:check`.
- `validate` completo passa a chamar `drift:check`.
- O comando interativo `drift` tenta validar a descrição do PR atual via `gh` autenticado; se
  GitHub/auth não estiver disponível, explica a ausência de auth e oferece caminho manual.
- O doctor detecta gate aprovado sem avanço de topologia e próximo nó de execução ainda não
  materializado como PR/branch.

## Fronteira de autoridade

Autodetectar não significa auto-reparar.

- `drift` continua read-only.
- `repair` continua separado, com preview, confirmação e revalidação.
- Drift #1 é reparável porque `active.yml` é projeção derivável e tem gerador determinístico.
- Drifts #2, #3, #4, #5, #6 e #7 permanecem como detectar/explicar + decisão humana, conforme classificação
  registrada em `2026-06-21-checkpoint-co-flow-continuation-drift-classification.md`.
- Human Gate, Ready, merge, avanço de nó e alterações de topologia continuam fora de reparo automático.

## Valor para o produto

Com esta fatia, o usuário final não precisa conhecer `state.yml`, `active.yml`, topologia,
tasks ou projeções para perceber que algo está incoerente.

O framework passa a fazer três coisas no fluxo normal:

1. Detectar o drift.
2. Explicar por que ele importa em linguagem humana.
3. Apontar o caminho governado: reparo seguro quando existir, ou decisão humana quando não existir.

## O que permanece para depois

- Ampliar a cobertura de detecção do drift #8 dentro do CO-10.8.2, junto da reorganização/higiene
  de artefatos `research/`.
- Refletir no site público o valor de autodetecção de drift depois que o fluxo estabilizar.
- Transformar o "PR Progress Map" em artefato/produto governado quando o padrão amadurecer.
- Refletir a experiência final no site público depois que o fluxo estabilizar.

## Validação esperada

- `npm run build`
- `npm run test:ts -- governancePreflight DiagnoseDriftCommand WorkCommand DecideCommand changedValidation flowCopyProjection main`
- `npm run validate:changed`
- `npm run validate`

Este artefato não executa Ready, Human Gate, merge nem avanço de checkpoint.
