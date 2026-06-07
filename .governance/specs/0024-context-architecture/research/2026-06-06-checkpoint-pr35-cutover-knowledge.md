# Checkpoint de Retomada — PR #35: CLI cutover + ciclo-de-vida do conhecimento (SSOT)

> **Documento de RETOMADA canônico** (ADR 0022, situado). Assume zero acesso à conversa anterior.
> **Supersede para retomada** o `2026-06-05-checkpoint-pr35-visual-governance.md` (cujas decisões
> seguem válidas; o estado avançou 7 commits) e o `2026-06-06-checkpoint-merge-prematuro-encerramento.md`
> (arco encerrado, não reabrir). Data: 2026-06-06. Consolida o já feito; sem decisões novas.

---

## 1. Estado atual

| Item         | Valor                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Branch       | `feat/spec-0024-pr-cli-cutover` (= PR **#35**, Draft, modo `unit`)          |
| HEAD         | `0079c5b`                                                                   |
| Origin       | `bde1709` — **11 commits NÃO pushados** (push exige autorização, CORE-07)   |
| Working tree | limpo · `yarn validate` **verde** (97 suites / 940 testes + todos os gates) |

**Esta sessão (7 commits sobre `567c46a`):** `e77a87a` (falsifica confirm-in-run) → `d319f61` + `f521310` + `1d53fc7` (cutover) → `e87c4b4` + `7fe645a` + `0079c5b` (ciclo-de-vida do conhecimento).

---

## 2. CLI cutover — feito × restante

**Feito nesta sessão** (o `engine.mjs` não tem mais NENHUM dispatcher por comando; só o **bridge** → registry + `execute()` do bootstrap):

- `d319f61`: removidos `dispatchReleasePrep`/`dispatchReview`/`dispatchInsight` + branches (registry os cobre).
- `f521310`: removido `dispatchWorkflow` + `workflow`/`continue` de `SUPPORTED_MODES` (eram o único acoplamento que travava a remoção — pré-build agora erra limpo).
- `1d53fc7`: podadas as exceções mortas de `parseArgs` (review/insight) + teste morto; **rename `review.ts → triage.ts`** (símbolos `Review*→Triage*`, `runReview→runTriage`); argv vestigial enxugado. **Alias CLI `review` PRESERVADO** (contrato publicado v1.1.0; `triage` é o nome canônico no código, sem doc user-facing ainda).

**Resíduo real (após falsificação 2026-06-06, ADR 0026):** `integration-open`/`merge-stack` **NÃO convergem** a Commands — são **passos do rito de encerramento** (operações do `workflow`; "wizard option 4/5" por design, `[DEC-0023-L01]`; único invocador = `workflow.ts`), não capabilities de 1ª classe. Single-homed → promovê-las não removeria drift, só reificaria projeção (a própria "pendência de convergência" era projeção reificada). Os já-migrados (`specs`/`drift`/`visual-prompt`) **estão feitos**; o wizard legado apenas os **duplica**. Então o único resíduo é **OPCIONAL**: remover as 3 entradas duplicadas do `runWizard`/`runAdvancedOps`. Os ops de encerramento + `continue-other`/`publish-state-help` (affordances) permanecem operações do wizard (casa legítima). → **#35 substantivamente DONE.**

---

## 3. Fronteira de escopo do #35 (decidida e aprovada pela owner)

- **Opção A aprovada:** o #35 fecha após a convergência das ops + os resíduos de cutover. **`bootstrap → registry`** (init/adopt/providers/update/check-budget) é **NÓ PRÓPRIO**, não #35 — é ~4× o código do registry entregue, outro subsistema (.mjs→TS), coeso com `pr-compiler-ts` (sequence 4). A projeção §6c do checkpoint visual-governance que punha bootstrap no DONE do #35 foi **revisada** (medição mostrou que não cabe).
- `confirm-in-run` **RESOLVIDO**: sem abstração (`runTransactional` over-modeling + `confirmOrAbort` redundante — deny-by-default já single-sourced no port `Prompts.confirm`). Detalhe: `research/2026-06-06-confirm-in-run-falsification.md`.

---

## 4. Ciclo-de-vida do conhecimento (arco desta sessão — bem conectado no repo)

Falha estrutural descoberta: aprendizado recorrente preso em research **nunca entrava no caminho de reaparecimento** (a lente projeção-vs-entidade ficou ~14 instâncias sem graduar e quase reincidimos). Correção (sem nova capability/abstração; reusa a escada `KnowledgeStage` + `occurrences` + `insights:check`):

- **`ADR 0026`** (`0026-projection-distinct-from-first-class-entity`): cristaliza a lente **projeção ≠ entidade de 1ª classe**. Critério decisivo: colapsar só se remove drift/cópia/sync; senão é renomear. Guard anti-elegância (≥2 instâncias). §4: mesma capability em 2 superfícies ≠ reificação.
- **`PIT-0009`** (`insights.yml`): a lente promovida (graduada → `doctrine:ADR-0026`); backlink no research `2026-05-30-projection-vs-entity-lens.md`.
- **Detector de maturação** (`src/cli/insightsCheck.ts`): Insight `open` com `occurrences ≥ 3` sem graduação → ⚠️ "candidato à graduação". Mecânico detecta; humano decide; **não auto-promove, não falha o CI** (graduar é evento, não estado — PIT-0008). Fecha o salto `PIT → graduação`.
- **Captura proativa** (`governance-foundation.md` § "Percepção em Trânsito" + anti-padrão #7): o salto `observação → PIT` é **semântico** = trabalho do **agente** (a IA oferece `insight add` ao notar recorrência; humano aprova). **Distinção cravada (correção de B06):** `[DEC-0023-B06]` veta inferência no **runtime/wizard** (lookup-only), **NÃO** a inferência do agente (AI-as-channel é o valor). O gate é na **DECISÃO** (ADR 0021), não na percepção. **Regra: inferência sugere; humano decide.**

---

## 5. NÃO REABRIR (encerrado/falsificado)

- **Arco merge-prematuro** (enforcement de aterrissagem): encerrado como pesquisa; superfície deferida; commits falsificados na tag `evidence/merge-prematuro-falsified`. Não reabrir status check/R8/review.md/landing_policy/vehicle/GitHub Reviews.
- **confirm-in-run**: resolvido = sem abstração. Não recriar `runTransactional`/`confirmOrAbort`.
- **Governança visual** (#35): prompt final gateado, não a imagem; Draft/Ready do flag `isDraft`. Não reabrir.
- **B06 como ban global de inferência**: é escopado ao wizard/runtime. Não generalizar (erro corrigido em `0079c5b`).
- **`integration-open`/`merge-stack` como pendência de convergência a Commands**: **FALSIFICADO** (2026-06-06, ADR 0026) — são passos do rito de encerramento (operações do `workflow`), não capabilities. Não tentar convergi-los.

## 6. Próximo ponto de retomada

1. **#35 = NÓ substantivamente concluído** (não a spec; falsificação 2026-06-06: integration-open/merge-stack não convergem — §2). Resíduo só opcional (3 duplicatas no wizard legado). **Próximo passo = GATE do nó #35** (3 etapas): Technical Audit (Codex) → Architectural Review (ChatGPT) → Human Gate (owner). O **Human Gate do #35 decide o próximo movimento = abrir o próximo nó _stacked_** (`pr-compiler-ts`, sequence 4) — **NÃO mergeia em `main`** (`plan.md` § Glossário/Gate). **Integration PR + merge da spec NÃO acontecem aqui:** o rito de encerramento (`review.md` R1–R8 → Integration PR → merge atômico, modo `unit`) é exclusivo do **nó terminal `integration-final`**, só após `pr-dualroot-collapse` (sequence 10). A topologia viva (`state.yml § topology`, SSOT `[DEC-0024-G07]`) tem **6 PRs de execução + 1 Integration PR depois do #35**.

   > ⚠️ **Correção 2026-06-06 (conflação removida):** versões anteriores deste §6 afirmavam que "o próximo passo após o #35 = rito de encerramento → Integration PR → merge atômico". Isso **conflacionava encerramento do NÓ #35 com encerramento da SPEC 0024** — falsificado pelas fontes estruturais (`state.yml § topology` / `plan.md` § Gate / `active-specs.yml` = `implementation`/`active`; base do #35 = `feat/spec-0024-insights-in-flight`, branch do #34, **não** `main`). #35 é **sequence 3 de 10**. A frase chegou a se propagar (memória `spec-0024-resumption-ssot`, corpo do commit `20bc58e`); saneada aqui e na memória.

2. `bootstrap → registry` = **nó próprio** (com `pr-compiler-ts`), fora do #35.
3. `review` alias: quando publicar a próxima release, migrar docs (README/WORKFLOW/CONTRIBUTING/docs-cli/help) para `triage` primário + `review` como alias depreciado (transição docs-led; manter o alias — contrato v1.1.0).

## 7. Riscos residuais

- **Token budget universal 1709/1500 (114%)** — soft/consultivo (build não falha).
- **`active-specs.yml` 0024.branch** registra a última `publish-state` (refrescada nesta rodada para `#35`); `active-specs:check` valida `stage`, não `branch` — não é invariante.
- **`#35` levado a Ready** precisará de governança visual no próprio body (hoje Draft → isento).
- Convergência das ops avançadas: o ponto delicado é preservar o comportamento (detecção de stack/modo, readiness gate) ao mover a orquestração do wizard para o `run` do Command.

## 8. Cross-refs

- Cutover: `src/cli/registry/buildRegistry.ts` (8 Commands), `cli/app/engine.mjs` (bridge + execute), `src/cli/workflow.ts` (wizard + ops avançadas pendentes).
- Conhecimento: `ADR 0026` · `PIT-0009` (`insights.yml`) · `src/cli/insightsCheck.ts` (detector) · `governance-foundation.md` (§ PIT + anti-padrão #7) · research `2026-05-30-projection-vs-entity-lens.md`.
- Irmãs: `PIT-0008` / `2026-06-05-enforcement-surfaces.md` (evento≠estado); `PIT-0007` / `2026-06-04-epistemic-commitment-model.md`.
- Memórias: [[spec-0024-resumption-ssot]] (aponta aqui), [[merge-prematuro-open-arc]], [[proactively-surface-pit-candidates]], [[spec-0024-checkpoint-flow]].
