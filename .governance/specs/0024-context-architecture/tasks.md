<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=4 -->

# Tasks — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress — **Absorção operacional** (Stage 1 encerrado; gate de research fechado)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md § Decisões revisitadas` e ajustar tasks impactadas.

> ## 📖 Vocabulário (cf. `plan.md § Glossário operacional`)
>
> **PR / `#N`** = Pull Request real do GitHub · **Checkpoint N** = unidade de implementação da spec · **Gate** = ritual de validação (`Technical Audit Gate` → `Architectural Review Gate` → `Human Gate`). _"PR-N" foi aposentado (Checkpoint 2.1) — conflitava com Pull Request real; a 0023 já diagnosticara (review R6)._

> ## 🔁 Nota de fase — ABSORÇÃO OPERACIONAL (2026-05-31, Checkpoint 2)
>
> **Stage 1 (research → decision-brief → gate) encerrou** com as decisões `Resolved` (`[DEC-0024-G00]`/`G02`/`G06`) e o **gate fechado**. A execução agora é a **sequência de Checkpoints de absorção** (SSOT em [`plan.md` § "Sequência de Checkpoints"](./plan.md)), não mais o scaffold research-first.
>
> A **Fase 0** abaixo é **registro histórico** do bootstrap + Stage 1. O marcador de template (`tasks-evidence-driven-boilerplate`) e o rótulo `evidence-driven` são **legados** — a taxonomia foi removida por `[DEC-0024-G02]`; sua eliminação do recipe/partials é **execução derivada** (Checkpoint 10), não ocorre aqui. A execução viva está na **Fase de Absorção**.

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate) — ✅ ENCERRADA

> **Resultado (gate fechado, 2026-05-31):** decisões cravadas `[DEC-0024-G00]` (identidade = transformação `contexto humano → governança executável`), `[DEC-0024-G02]` (taxonomia de tipos removida → bloco + propriedade `exige-julgamento`), `[DEC-0024-G06]` (contrato da cadeia) — todas `Resolved`. Pesquisa estrutural ainda aberta migrou para `research/findings.md` (não bloqueia).

### Sub-bloco [0.Setup] — Bootstrap e instanciação ✅

- [x] **0.1** Bootstrap: `roadmap/backlog.md` + `governance-foundation.md § "Tipos de spec"` lidos na sessão de planejamento (2026-05-28).
- [x] **0.2** Tipo de spec confirmado na instanciação: `evidence-driven` (research-first). _Nota: rótulo hoje legado — taxonomia removida por `[DEC-0024-G02]`._
- [x] **0.3** Slug semântico: instanciado como `handoff-as-first-class`; **renomeado para `context-architecture`** (2026-05-30, autorização da owner; nº 0024 imutável, ADR 0017).
- [x] **0.4** Branch `feat/spec-0024-context-architecture` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado; campo `Decision Brief` aponta para `./decision-brief.md`.
- [x] **0.6** Validação humana inicial de problema/escopo — **coberta pelo gate fechado** (decisões `Resolved` em `decision-brief.md`).
- [x] **0.7** `plan.md` instanciado (Stage 1/Stage 2 placeholder → **dobrado na sequência de Checkpoints**, Checkpoint 2).
- [x] **0.8** `tasks.md` (este arquivo) instanciado.
- [x] **0.9** `decision-brief.md` instanciado; depois **reestruturado por estado** (2026-05-31), DECs `Resolved`.
- [x] **0.10** `roadmap/backlog.md` atualizado (handoff → `Em execução`).
- [x] **0.11** `NEXT.md` instanciado.
- [x] **0.12** Pull Request **#32** criado (PR de governança/bootstrap da 0024).
- [x] **0.[COMMIT]** Commits da sessão de instanciação registrados (git).

### Sub-bloco [0.Research → 0.Gate] — Stage 1: research → opções → gate ✅ (superado pela reforma do brief)

> O scaffold granular research-first (`0.R.*` / `0.B.*` / `0.G.*`) foi **superado pela reforma por estado** do `decision-brief.md` (2026-05-31): perguntas abertas migraram para `research/findings.md` (findings abertos) e as decisões convergidas foram cravadas `Resolved`. Histórico verbatim: **git** + research datadas.

- [x] **Stage 1 — research produzida:** inventário arquitetural + comparativos (Hermes, Cursor, opencode, Spec Kitty, Multica) + findings convergidos (`F-001..F-014`) em `research/findings.md`.
- [x] **Stage 1 — decisões cravadas:** `[DEC-0024-G00]` / `[DEC-0024-G02]` / `[DEC-0024-G06]` `Resolved`; brief reestruturado por estado.
- [x] **Gate humano de research fechado** (2026-05-31, @rosanarezende): `decision-brief.md § Gate — assinaturas`.
- [x] **`state.yml`** atualizado para `stage: implementation` / `gate.status: closed`.
- [x] **plan.md / tasks.md "v2"** = reframe de absorção + sequência de Checkpoints (Checkpoint 2) + correção de vocabulário (Checkpoint 2.1).

---

## Fase de Absorção — execução da sequência de Checkpoints (Stage 2, dentro da 0024)

> **Execução viva.** Remover divergências decisão↔código uma a uma. Detalhe canônico de cada checkpoint (objetivo, deps, ordem de valor, PR real, princípios) em [`plan.md` § "Sequência de Checkpoints"](./plan.md). Cada checkpoint estrutural: atômico/reversível + **Gate** completo (Technical Audit → Architectural Review → Human) + `yarn validate` verde. **1 checkpoint por vez; parar no Gate.**
>
> **Topologia (cf. `plan.md § Topologia operacional` — CANÔNICA / 0023, corrigida no Checkpoint 2.1a):** **#32 = PR de governança/bootstrap + linha de integração da spec** (acumula Checkpoint 1 + 2 + 2.1 + 2.1a) — **NÃO mergeia cedo**; é a **base da stack**. **Checkpoint 3 em diante = PR real próprio _stacked_** sobre a linha da spec (não off-`main`), Draft → Gate → **avançar**. **Merge em `main` = evento único ao fim** (modo `unit`; veículo = PR terminal; demais via `landed-via reconciliation`), após `review.md` R8.

- [x] **Checkpoint 1** — `active-specs.yml` lista a 0024 (Codex A3). ✅ feito + gated (`87865ca`); Gate completo no **#32**.
- [x] **Checkpoint 2** — reframe `spec/plan/tasks/NEXT` → absorção + dobrar a sequência no `plan.md` (Codex A2/P1/P2). ✅ feito + gated (`8b0eec6`).
- [x] **Checkpoint 2.1** — correção de vocabulário (PR-N → Checkpoint N; ritual → Gate) + alinhamento à 0023. ✅ feito + gated (`d686d4b`).
- [x] **Checkpoint 2.1a** — **correção arquitetural pós-dogfooding**: substitui a topologia incorreta do 2.1 pela canônica da 0023 (`unit`/_stacked_/merge único ao fim; #32 não mergeia cedo). ✅ feito + gated (`fa2c0ae`); o Gate de encerramento do #32 cobriu Checkpoint 2 + 2.1 + 2.1a (reconciliation do FAIL ambiente-dependente do Codex + architectural_review + human_gate).
- [x] **Checkpoint 2.2** — **correção estrutural pós-dogfooding (precede o 3)**: `ruleset:check` — **producibilidade** (PRIMÁRIO, no `validate`) + **paridade** (SECUNDÁRIO, detect-only no `ruleset-drift.yml`) + **ruleset-as-code** (`.github/rulesets/main-governance.json`) + agregador estável `smoke`. **PR próprio _stacked_** (`feat/spec-0024-ruleset-producibility`). ✅ feito + gated (incorporando Checkpoint 2.2b). _(dep: Checkpoint 2.1a)_
- [x] **Checkpoint 2.2b** — **correção da fronteira mecânica (achado Codex no PR #33)**: extração de gatilhos-base (`on: [pull_request, push]`) + suporte declarativo a produtores externos, prevenindo órfãos de evento absoluto sem criar um workflow engine. ✅ feito + gated
- [x] **Checkpoint 2.3** — **Governance Topology as Data**: topologia como dado (SSOT) no `state.yml` + `governance-pr-check` valida título/template como projeções; UX do CI (Skipped→Success/Exempt). Em **#33**. ✅ implementado; o Architectural Review Gate pediu B1/B2 → **absorvidos no 2.3a**. _(dep: Checkpoint 2.2b)_
- [/] **Checkpoint 2.3a** — **correção derivada do 2.3 (Architectural Review)**: reconcilia topologia↔realidade (B1 — remove nó-fantasma, dobra Checkpoints em #33), registra `[DEC-0024-G07]` (B2), elimina dual-SSOT do `plan.md` (O1), invariantes de `sequence` no schema (O6 — única/contígua/`execution`-only), robustez do `governance-pr-check` sem parser (O2). Mesmo PR (**#33**). Implementado; gate pendente cobre 2.3a+2.3b. _(dep: Checkpoint 2.3)_
- [/] **Checkpoint 2.3b** — **guard local de lifecycle-coerência da topologia** (sustenta a promoção do `governance-pr-check` a `required`): `github_pr` ⟺ `active`/`concluded` + unicidade de `github_pr` no `workflowStateSerializer` (regressão explícita do nó-fantasma); **reavaliação do O5** → well-formedness é guard local (não débito de API), promoção a `required` **recomendada**; `NEXT` separado (só a paridade-API resta como hardening futuro). Mesmo PR (**#33**). **EM EXECUÇÃO**; `yarn validate` verde. _(dep: Checkpoint 2.3a)_
- [ ] **Checkpoint 3** — GG-0003 Consistency Projection Check (mecânico, lista fixa de marcadores). **PR próprio _stacked_.** _(dep: Checkpoint 2.3b)_
- [ ] **Checkpoint 4A** — Workflow Provenance · storage (`provenance.yml` append-only, `role` livre, espinha derivada). **PR próprio _stacked_.** _(dep: Checkpoint 1/2; protótipo em `git stash` = referência)_
- [ ] **Checkpoint 4B** — Workflow Provenance · projeção no `workflow continue` (fatos/pendências, não prescrição). **PR próprio _stacked_.** _(dep: Checkpoint 4A)_
- [ ] **Checkpoint 5** — AGENTS sync (`agents:build` + `agents:check` no `validate`). **PR próprio _stacked_.** _(destrava Checkpoint 7)_
- [ ] **Checkpoint 6** — GG-0002 mecanismo (`banned-concept-check` + `banned-by-dec.yml` + fixture). **PR próprio _stacked_.** _(antes da remoção)_
- [ ] **Checkpoint 7** — **CRÍTICO**: remover taxonomia do runtime/doutrina/boilerplate + ativar ban no mesmo commit. **PR próprio _stacked_.** _(dep: Checkpoint 5 + 6)_
- [ ] **Checkpoint 8** — corrigir path morto na msg do `gate-decidability-check`. **PR próprio _stacked_.** _(flex)_
- [ ] **Checkpoint 9** — desacoplar existência do `decision-brief` de `evidence-driven/mixed`. **PR próprio _stacked_.** _(dep: Checkpoint 7)_
- [ ] **Checkpoint 10** — tasks boilerplate único; renomear recipe/partials `tasks-evidence-driven`→genérico. **PR próprio _stacked_.** _(dep: Checkpoint 7)_
- [ ] **Checkpoint 11A** — drift-guard do legado `.specify/templates`. **PR próprio _stacked_.** _(dep: Checkpoint 10)_
- [ ] **Checkpoint 11B** — trocar fonte ativa → root canônico (⚠️ micro-decisão da owner). **PR próprio _stacked_.** _(dep: Checkpoint 11A)_
- [ ] **Checkpoint 11C** — remover legado `.specify/templates`. **PR próprio _stacked_.** _(dep: Checkpoint 11B)_
- [ ] **Checkpoint 12** — limpar docs arquiteturais de `workflowType`. **PR próprio _stacked_.** _(flex)_

---

## Fase de Review → vive em `review.md`

> **Modelo de 3 boundaries (`[DEC-0023-M01]`):** o **Gate por checkpoint** (4 papéis, em cada PR) é a revisão da implementação daquele PR. A **prontidão de integração da spec** vive em `review.md` (gates R1–R9), **instanciado no encerramento** — agrega/confirma que o conjunto de checkpoints landou coerente, gateia o Integration PR (R1–R7) e o merge de encerramento (R8). `tasks.md` é execution-only e fecha 100% `[x]` ao fim da execução = sequência de Checkpoints (1…12) concluída, dentro da própria 0024.

---

## Fase de Encerramento → vive em `release-log.md` + Integration PR

> **Integration PR (`[🔗] [Integration]`) nasce no fim** (após o último checkpoint + `review.md` R1–R7 fechados): homologa a 0024 ponta-a-ponta — **boundary de revisão + pré-condição do merge final, não veículo de aterrissagem** (ADR 0024). O commit de encerramento (spec→`Done`, `state.yml`→`done`, `NEXT.md` deletado, `release-log.md` T0) entra na linha da spec **antes** do **merge único** (modo `unit`: veículo = PR terminal de implementação; #32 + intermediários + Integration PR via `landed-via reconciliation`; 1 SHA canônico), após `review.md` R8. A **migração ampla do ecossistema (Grupo B)** permanece nas candidatas re-escopadas, não nesta spec (fronteira modelo ≠ migração).
