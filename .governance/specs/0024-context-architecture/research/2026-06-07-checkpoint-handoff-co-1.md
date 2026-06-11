> ⚠️ **HISTÓRICO — NÃO USAR PARA RETOMADA (marcado em 2026-06-11).** Snapshot do estado de
> 2026-06-07 (abertura do CO-1→CO-2). Sucedido na prática por
> `2026-06-07-checkpoint-handoff-co-2.md` (também histórico). A retomada atual é derivada:
> `npm run guidelines -- handoff 0024` + reconciliação contra `state.yml § topology` e Git.

# Checkpoint de Handoff — Spec 0024 pós-Human-Gate do #35 → CO-1 (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022, situado). Assume **zero acesso a este transcript**.
> **Supersede para retomada** o `2026-06-06-checkpoint-pr35-cutover-knowledge.md` (decisões válidas;
> o estado avançou: #35 concluído + topologia reescrita). Data: 2026-06-07. Sem decisões novas —
> consolida o já decidido/feito. **Leia este arquivo primeiro; reconcilie contra os arquivos, não
> contra memória.**

---

## 0. Ordem correta de retomada (faça nesta sequência)

1. `git status` (tree limpo? `.codex/` untracked é tooling externo, ignore) · `git log --oneline -6`.
2. Ler **este** checkpoint + a memória `spec-0024-continuity-operational` + `state.yml § topology`.
3. `yarn validate` (deve estar verde: 98 suites / 946 testes + todos os gates).
4. Confirmar `state.yml`: `cursor.pr = co-reconcile`, `#35` em `concluded`, `active: []`.
5. **Só então** iniciar **CO-1 (`co-reconcile`)** — ver §6. **NÃO** antes; **NÃO** outra coisa.

## 1. Estado da branch

> **Fatos voláteis NÃO são fixados aqui** (dogfood da CO / ADR 0026 — INV-4: fato derivável aponta para a derivação, não é hand-pinned; um checkpoint não cita o próprio SHA sem ficar stale). Reconcilie sempre contra `git`.

| Item         | Valor                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch       | `feat/spec-0024-pr-cli-cutover` (= PR **#35**, CONCLUÍDO; modo `unit`)                                                                                        |
| HEAD         | último commit desta branch — `git log --oneline -1` (não fixo: vide nota acima)                                                                               |
| Origin       | sincronizado por push autorizado (2026-06-07) → **origin == HEAD**; confirme `git status` / `git rev-list --count origin/feat/spec-0024-pr-cli-cutover..HEAD` |
| Working tree | limpo (exceto `.codex/` untracked = tooling externo) · `yarn validate` **verde**                                                                              |

**Sequência de commits desta rodada** (temas; SHAs vivos em `git log --oneline 20bc58e..HEAD`): remove conflação nó/spec → help derivado do registry + hardening do `loadRegistry` → fail-fast (corrige o _false-fix_ do #3) → gate do #35 como artefato → reescreve a topologia (cauda CO) → handoff → reconciliação pós-Codex.

## 2. Human Gate do #35 — APROVADO (2026-06-07)

PR #35 **encerrado como concluído**. O cutover CLI → Command Registry atingiu seu objetivo: o dispatch central legado não governa mais os comandos migrados; extensibilidade restaurada. Artefato: `gates/c-cli-cutover.yml` (`decision: approved`). O Human Gate decidiu o **próximo movimento = reescrever a topologia** (feito, `c6f5e87`) — **NÃO** merge (modo `unit`; merge em `main` é evento único ao fim da spec, via `review.md` R8).

## 3. Auditoria técnica (Antigravity/Gemini 3.1 Pro) — ENCERRADA

Artefato: `reviews/c-cli-cutover-technical_audit.yml` (4 findings, todos `accepted`).

- **#1 Roteamento paralelo** (engine.mjs serve registry + `execute()` bootstrap) → **transição em fases ACEITA** → resolvido no nó `bootstrap-compiler`.
- **#2 Help desacoplado do registry** → **RESOLVIDO** (`e29a3d2`): `Command.description` obrigatório + `renderHelp` derivado do registry (matou o `printHelp` hardcoded + o drift que omitia insight/specs/drift/visual-prompt e mostrava `review` em vez de `triage`).
- **#3 Fallback silencioso → wizard de bootstrap** → **RESOLVIDO** (`1f1da7a`). A 1ª correção (`e29a3d2`, só o `catch` nu) foi **false-fix**; a 2ª auditoria pegou. Fix real: `dist/` ausente + comando não-bootstrap → falha rápido ("rode `yarn build`"), nunca o wizard.
- **#4 Parsers duplicados** (`parseFlags` + `parseArgs`) → **transição em fases ACEITA** → resolvido no nó `bootstrap-compiler`.

## 4. Revisão arquitetural (ChatGPT) — APROVADA

Artefato: `reviews/c-cli-cutover-architectural_review.yml` (`approved`, 0 findings). PASS técnico + PASS arquitetural **com observações** (não-bloqueantes): (1) `Bootstrap+Compiler` é dívida futura explícita; (2) topologia reescrita pós-gate (feito); (3) WorkItem-registry-persistido cede à frontier derivada.

## 5. Nova topologia aprovada — Opção A (reframe in-place)

**A Continuidade Operacional (CO) integra a CAUDA da própria Spec 0024.** NÃO spec paralela, NÃO sucessora (isso reincidiria o padrão `0025`). SSOT estrutural = `state.yml § topology` (`[DEC-0024-G07]`).

- **Concluídos:** `#32` (governança/base) · `#33` (ruleset, seq 1) · `#34` (Knowledge + KnowledgeGraph, seq 2) · `#35` (cutover CLI, seq 3).
- **Cauda CO planejada (ordem por IMPACTO; `sequence` 4–12 contígua; `github_pr: null`):**
  - `co-reconcile` (4) — **CO-1**: `reconcile:check` + contrato de autoridade.
  - `co-knowledge` (5) — **CO-2**: Knowledge tipado + `Falsification`/fingerprint + aresta `constrains`.
  - `bootstrap-compiler` (6) — funde ex-`pr-compiler-ts` + migra bootstrap→registry; **resolve auditoria #1/#3/#4**.
  - `co-enforcement` (7) — **CO-3**: `EnforcementBinding` + `knowledge:compile`.
  - `co-projection` (8) — **CO-4**: projetor situado + contrato de carga.
  - `co-capture` (9) — **CO-5**: captura na formação + ciclo de vida; dissolve `NEXT.md`.
  - `co-events` (10) — **CO-6**: dispatcher de eventos / disparo automático.
  - `housekeeping` (11) — faxina ortogonal SOBREVIVENTE: `taxonomy-removal` (P0), `agents-sync`, `gg-0002`, `decouple-brief`, `doc-cleanup`.
  - `dualroot-collapse` (12) — migração `.specify` / colapso dual-root.
  - `integration-final` (terminal) — `review.md` R1–R8 → Integration PR → merge único.

## 6. Próximo passo imediato (próxima sessão começa AQUI)

> **ATUALIZAÇÃO 2026-06-07 (pós-autorização do owner):** CO-1 **IMPLEMENTADO** — **PR #36** aberto (stacked sobre #35; modo `unit`, NÃO mergeia), em ciclo de gate. `reconcile:check` advisory-first roda no `validate`; topologia: `co-reconcile` movido para `active` (github_pr 36); `state.yml § next[0]` reescrito. O **estado vivo** está em `state.yml § next/topology` + `git log` (a Regra Zero vence este texto). **Próximo = GATEAR o CO-1** (Technical Audit Codex → Architectural Review ChatGPT → Human Gate). O parágrafo abaixo é o planejamento original do nó — cumprido.

**Iniciar CO-1 = `co-reconcile`** (`reconcile:check` + contrato de autoridade). Ataca a classe **PIT-0001 / conflação** (a retomada lê o _narrado_ em vez do _derivado_). Esboço: derivar o canônico de `state.yml`/topology; detectar divergência contra afirmações narradas (estendendo o padrão do `active-specs:check`); recusar o não-reconciliado como autoridade. **Gates CO entram advisory-first** (padrão `governance-pr-check`). Abrir um PR stacked próprio (ação CORE-07, sob autorização). Ciclo: implementação → Technical Audit (Codex) → Architectural Review (ChatGPT) → Human Gate.

## 7. NÃO REABRIR (decidido/falsificado)

- **#35** — concluído; não reabrir o cutover. **CO como spec paralela/sucessora** — rejeitado (Opção A). **Não iniciar CO-1 fora da próxima sessão dedicada.**
- **`integration-open`/`merge-stack` → Command** — falsificado (ADR 0026; passos do rito de encerramento).
- **`confirm-in-run`** — resolvido sem abstração.
- **WorkItem Registry persistido como working-set** — rejeitado; a frontier é **derivada** (INV-4). (`WorkItem` como _tipo de nó_ sobrevive em `co-knowledge`.)
- **Aterrissagem intermediária da 0024** — **NÃO aprovada**; mantém `unit`/`integration-final` (mudar é decisão deliberada própria futura).
- **Arco merge-prematuro** (enforcement contínuo de aterrissagem) — falsificado (tag `evidence/merge-prematuro-falsified`).
- **B06 como ban global de inferência** — escopado ao runtime/wizard.

## 8. Riscos ACEITOS conscientemente

- **#1/#4 da auditoria** (roteamento + parser legados coexistindo) — transição em fases até `bootstrap-compiler`.
- **R-EXEC-1**: manter `unit` → stack longa + blast radius do merge único. Aceito; gerenciado por rebase disciplinado + nós CO atômicos/reversíveis + `landed-via` no `integration-final`.
- **Token budget universal 1709/1500 (114%)** — soft/consultivo (não falha o build).

## 9. Riscos ainda VIVOS (mitigar na execução)

- **Gates da CO podem barrar o próprio fluxo de trabalho** se entrarem `required` cedo → **advisory-first**, promover só após uso real.
- **Disciplina modelo ≠ migração**: a CO é modelo + implementação de referência; não deixar inchar para migração de ecossistema (Grupo B).
- **Reificar projeção como entidade** (ADR 0026): relatório de reconciliação, frontier e handoff são DERIVADOS (renderer-puros); só nós + ligações são entidades. Se virar "store de contexto para IA", rejeitar o mecanismo (ADR 0022 § anti-distorção).
- **`active-specs.yml`** registra a última `publish-state` (branch de trabalho); refresh = re-rodar `publish-state`, NÃO hand-edit (`active-specs:check` valida `stage`, não `branch`).

## 10. Cross-refs

- SSOT estrutural: `state.yml § topology`. Plano/Objetivo: `plan.md` (cadeia + tabela 3–12 marcada PRÉ-CO).
- Gate #35: `gates/c-cli-cutover.yml` + `reviews/c-cli-cutover-{technical_audit,architectural_review}.yml`.
- Arquitetura CO + "não reabrir": memória `spec-0024-continuity-operational`. Lição do false-fix: memória `fix-motivating-behavior-not-named-smell`.
- Lentes: ADR 0022 (handoff situado derivado) · ADR 0026 (projeção≠entidade) · ADR 0018 (sem LLM no runtime) · ADR 0021 (enforcement/gate humano) · PIT-0001/0002/0003 (retomada/absorção) · PIT-0008 (declaração≠enforcement).
