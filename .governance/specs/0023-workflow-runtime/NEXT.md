<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0023 Workflow Runtime

> **Casca de encerramento (R3 fechada em 2026-05-25).** O acompanhamento contínuo desta spec foi triado: itens **relevantes e ainda não capturados** migraram para [`../roadmap/backlog.md`](../roadmap/backlog.md); o restante já está **preservado em artefatos que sobrevivem ao merge** (decision-brief, CHANGELOG, memory, `.core/process/`) e morre com este arquivo sem perda.
>
> **Este arquivo é DELETADO no commit de encerramento pós-merge** (cf. [`review.md`](./review.md) R3 + [`release-log.md`](./release-log.md)), não aqui. A trilha completa de vigilâncias e insights permanece auditável no **histórico git** desta branch.

## Disposição da triagem (R3 — 2026-05-25)

### Migrado para o backlog canônico (`../roadmap/backlog.md`)

- **Débitos de cobertura concretos** (ex-"Pós-PR5 audit de testes": REPL structured commands, `collectLocalContext` success paths, `governance-pr-check`, adapters de I/O, batch BR-labels) → candidata **`coverage-rigor-enforcement`** (enriquecida com a lista).
- **Escalada do wizard (5→6→8 opções)** → nova candidata **`wizard-menu-scaling-redesign`** (critério ≥10 opções / confusão reportada).
- **Composite action de workflows · rename `buildContextBundle` · `fix` numeração dos boilerplates · batch BR-labels** → seção **`Later` (follow-ups pós-0023)**.
- **Cutover `cli/*.mjs` → `src/`** (ex-§10 "Sanctification cutover") → já vivo como item `cli-mjs-to-src-ddd-cutover` na candidata **`runtime-and-template-root-consolidation`**.

### Preservado fora do NEXT (sobrevive ao merge — não migra)

- **Vigilâncias anti-distorção** (runtime-state virando source-of-truth, UX-creep no índice, "wizard parece agente", veto a auto-detection/smart-routing) → `[DEC-0023-G05/E05/B06/L01]` no `decision-brief.md` **+** memory `[[feedback_lookup_not_coordination]]`.
- **Semântica de `updatedAt` · fronteira de `title` · `PublishState` mini-orchestrator · `publish-state` manual-first** → `[DEC-0023-G01/G03/G05]` + jsdoc do código + seção "Limitações conhecidas" do `CHANGELOG.md`.
- **Camadas de enforcement deferidas** (L3 hooks locais · drift detection semântico · runtime stateful complexo · pre-tool hooks de harness · "raridade" objetiva de fast-track) → `[DEC-0023-D02/D05/E03/E04/E05]` no `decision-brief.md` (cada uma com critério de revisita cravado).
- **Destinos do Bloco F** (F01–F05) → `decision-brief.md` + candidatas `boilerplate-system-modernization` (F03/F04) e `handoff-as-first-class` (F05, revisita obrigatória na abertura).
- **Convenção inquirer · ação 4 (placeholder) · gap de docs user-facing · guides `1.H.6`/`1.H.7` · examples `1.H.4`** → absorvidos nas candidatas `handoff-as-first-class` / `boilerplate-system-modernization` (revisita obrigatória).
- **Convenção de PR title** (emojis/labels/pillars fechados + anti-DAG guardrail) → `.core/process/pr-title-conventions.md` (doc canônico) + checkboxes do `pull_request_template.md`.
- **Lições de dogfooding** (items de `tasks.md` envelhecem após DEC nova · PR governance-only durante implementação ativa é anti-pattern · AI-slop em brain folder de ferramenta IA · modelo tri-party Antigravity+Claude+Owner) → `decision-brief.md` + histórico git; recorrência observável reabre como ADR/memory própria conforme os critérios já registrados.
- **Trilha legacy** em `.specify/specs/0023-governance-workflow-discovery-model/` é **evidência citável, não dívida** (insight #4) — referenciar por link relativo, nunca copiar. _(Pointer/índice no `research-index.md` é tarefa de fechamento — handoff §7.)_
