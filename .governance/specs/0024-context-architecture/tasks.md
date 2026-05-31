<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=4 -->

# Tasks — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress — **Absorção operacional** (Stage 1 encerrado; gate fechado)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md § Decisões revisitadas` e ajustar tasks impactadas.

> ## 🔁 Nota de fase — ABSORÇÃO OPERACIONAL (2026-05-31, PR-2)
>
> **Stage 1 (research → decision-brief → gate) encerrou** com as decisões `Resolved` (`[DEC-0024-G00]`/`G02`/`G06`) e o **gate fechado**. A execução agora é a **sequência de PRs de absorção** (SSOT em [`plan.md` § "Sequência de PRs"](./plan.md)), não mais o scaffold research-first.
>
> A **Fase 0** abaixo é **registro histórico** do bootstrap + Stage 1. O sub-bloco de marcador de template (`tasks-evidence-driven-boilerplate`) e o rótulo `evidence-driven` são **legados** — a taxonomia foi removida por `[DEC-0024-G02]`; sua eliminação do recipe/partials é **execução derivada** (PR-10), não ocorre aqui. A execução viva está na **Fase de Absorção**.

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
- [x] **0.7** `plan.md` instanciado (Stage 1/Stage 2 placeholder → **dobrado na sequência de PRs**, PR-2).
- [x] **0.8** `tasks.md` (este arquivo) instanciado.
- [x] **0.9** `decision-brief.md` instanciado; depois **reestruturado por estado** (2026-05-31), DECs `Resolved`.
- [x] **0.10** `roadmap/backlog.md` atualizado (handoff → `Em execução`).
- [x] **0.11** `NEXT.md` instanciado.
- [x] **0.12** Pull Request Draft **#32** criado (vivo).
- [x] **0.[COMMIT]** Commits da sessão de instanciação registrados (git).

### Sub-bloco [0.Research → 0.Gate] — Stage 1: research → opções → gate ✅ (superado pela reforma do brief)

> O scaffold granular research-first (`0.R.*` / `0.B.*` / `0.G.*`) foi **superado pela reforma por estado** do `decision-brief.md` (2026-05-31): perguntas abertas migraram para `research/findings.md` (findings abertos) e as decisões convergidas foram cravadas `Resolved`. Histórico verbatim: **git** + research datadas.

- [x] **Stage 1 — research produzida:** inventário arquitetural + comparativos (Hermes, Cursor, opencode, Spec Kitty, Multica) + findings convergidos (`F-001..F-014`) em `research/findings.md`.
- [x] **Stage 1 — decisões cravadas:** `[DEC-0024-G00]` / `[DEC-0024-G02]` / `[DEC-0024-G06]` `Resolved`; brief reestruturado por estado.
- [x] **Gate humano fechado** (2026-05-31, @rosanarezende): `decision-brief.md § Gate — assinaturas`.
- [x] **`state.yml`** atualizado para `stage: implementation` / `gate.status: closed`.
- [/] **plan.md / tasks.md "v2"** = reframe de absorção + sequência de PRs (este **PR-2**, em curso).

---

## Fase de Absorção — execução da sequência de PRs (Stage 2, dentro da 0024)

> **Execução viva.** Remover divergências decisão↔código uma a uma. Detalhe canônico de cada PR (objetivo, deps, ordem de valor, princípios) em [`plan.md` § "Sequência de PRs"](./plan.md). Cada PR estrutural: atômico/reversível + checkpoint Codex→ChatGPT→owner + `yarn validate` verde. **1 PR por vez; parar no checkpoint.**

- [x] **PR-1** — `active-specs.yml` lista a 0024 (Codex A3). ✅ feito + gated (`87865ca`); checkpoint completo no PR #32.
- [/] **PR-2** — reframe `spec/plan/tasks/NEXT` → absorção + dobrar a sequência de PRs no `plan.md` (Codex A2/P1/P2). **EM EXECUÇÃO** (este commit); checkpoint ao fim.
- [ ] **PR-3** — GG-0003 Consistency Projection Check (mecânico, lista fixa de marcadores). _(dep: PR-2)_
- [ ] **PR-4A** — Workflow Provenance · storage (`provenance.yml` append-only, `role` livre, espinha derivada). _(dep: PR-1/2; protótipo em `git stash` = referência)_
- [ ] **PR-4B** — Workflow Provenance · projeção no `workflow continue` (fatos/pendências, não prescrição). _(dep: PR-4A)_
- [ ] **PR-5** — AGENTS sync (`agents:build` + `agents:check` no `validate`). _(destrava PR-7)_
- [ ] **PR-6** — GG-0002 mecanismo (`banned-concept-check` + `banned-by-dec.yml` + fixture). _(antes da remoção)_
- [ ] **PR-7** — **CRÍTICO**: remover taxonomia do runtime/doutrina/boilerplate + ativar ban no mesmo commit. _(dep: PR-5 + PR-6)_
- [ ] **PR-8** — corrigir path morto na msg do `gate-decidability-check`. _(flex)_
- [ ] **PR-9** — desacoplar existência do `decision-brief` de `evidence-driven/mixed`. _(dep: PR-7)_
- [ ] **PR-10** — tasks boilerplate único; renomear recipe/partials `tasks-evidence-driven`→genérico. _(dep: PR-7)_
- [ ] **PR-11A** — drift-guard do legado `.specify/templates`. _(dep: PR-10)_
- [ ] **PR-11B** — trocar fonte ativa → root canônico (⚠️ micro-decisão da owner). _(dep: PR-11A)_
- [ ] **PR-11C** — remover legado `.specify/templates`. _(dep: PR-11B)_
- [ ] **PR-12** — limpar docs arquiteturais de `workflowType`. _(flex)_

---

## Fase de Review → vive em `review.md`

> **Modelo de 3 boundaries (`[DEC-0023-M01]`):** homologação/prontidão vive em `review.md` (instanciado quando a absorção amadurecer). `tasks.md` é execution-only e fecha 100% `[x]` ao fim da execução = sequência de PRs de absorção concluída (PR-1…PR-12, dentro da própria 0024).

---

## Fase de Encerramento → vive em `release-log.md`

> **Operações pós-merge** vivem em `release-log.md`. O encerramento cobre as decisões fundacionais cravadas + a absorção entregue dentro da 0024; a **migração ampla do ecossistema (Grupo B)** permanece nas candidatas re-escopadas, não nesta spec (fronteira modelo ≠ migração).
