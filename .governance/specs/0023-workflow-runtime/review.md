<!-- ai-guidelines: review-boundary v=1 -->

# Review — Spec 0023 Workflow Runtime — readiness para Integration PR

> Boundary de prontidão do PR de integração (#27).
> **R1–R7 [x] → o #27 pode ser aberto.** O #27 foca em **convergência topológica
> e conflitos de merge**, não em descobrir pendências.
> **R8 (merge authorization) fecha após a homologação do #27** e é o gate do merge-stack.
>
> **Stack atualizada (2026-05-26):** `#18 → #19 → #22 → #23 → #24 → #25 → #26 → #27`. O PR terminal de **bootstrap alignment** (`[DEC-0023-O01]`) pegou o **#26**; o **Integration PR passa a ser #27**.
>
> Gates determinísticos do runtime (sem IA, sem inferência):
>
> - opção 🔗 (Abrir Integration PR) bloqueia se **R1–R7** não estiverem `[x]`.
> - opção 🔀 (merge-stack) bloqueia se **R1–R8** não estiverem todos `[x]`.
>
> Migrado da antiga "Fase de Review" do [`tasks.md`](./tasks.md) (que agora é
> execution-only). Cf. `[DEC-0023-M01]`.

## Gates de prontidão (pré-integration)

- [x] **R1** — CI canônico verde: `yarn ci` verde na branch da stack (= `install --immutable` + `validate` + `test:smoke`); equivale aos workflows **Repo Validation** + **Smoke Tests (multi-OS)** + **Governance PR Check** no GitHub Actions. Evidência: link da run desses workflows. _(ex-3.2)_ **Verde local 2026-05-25:** `yarn ci` exit 0 — 645 testes + smoke verdes, living-docs sync, Prettier limpo. (Run do GitHub Actions a anexar quando o último push subir.)
- [x] **R2** — Runtime smoke (manual, TTY). Evidência: logs curtos do terminal. _(ex-3.5)_
  - wizard abre e renderiza briefing da 0023;
  - opção 🔗 bloqueia com `review.md` aberto (R1–R7);
  - opção 🔀 bloqueia sem merge authorization (R8);
  - `release-prep --dry-run` coerente com o CHANGELOG (versão alvo + dist-tag).
  - **Verde 2026-05-26 (TTY, branch `feat/spec-0023-dx-thinking`):** (a) wizard lista o índice e renderiza o briefing da 0023 — `Execution=complete · Integration readiness=BLOCKED (3 itens) · Release log=registrado`; (b) 🔗 bloqueia listando R2/R6/R7 + "Feche os gates R1–R7"; (c) 🔀 bloqueia listando R2/R6/R7/**R8** + "Feche R1–R8, incluindo R8 (merge authorization)"; (d) `release-prep --dry-run`: `1.0.1 → 1.1.0`, tag `v1.1.0`, pre-release **não**, dist-tag **`latest`** (coerente com o CHANGELOG `[Unreleased] — 1.1.0`). Confirma empiricamente a numeração R1–R8 da narrativa de bloqueio (commit `4d414ba`).
- [x] **R3** — NEXT migrado para backlog: débitos e vigilâncias relevantes migrados para `.governance/specs/roadmap/backlog.md` **antes do merge**; a **deleção** do `NEXT.md` acontece no encerramento (commit pós-merge) (`release-log.md`), não aqui. Evidência: commit que migra. _(ex-4.1)_ **Feito 2026-05-25:** triagem completa do `NEXT.md` (379 linhas) → (1) débitos de cobertura concretos foldados na candidata `coverage-rigor-enforcement`; (2) nova candidata `wizard-menu-scaling-redesign`; (3) nova seção `Later` (composite action, rename `buildContextBundle`, fix numeração boilerplates, batch BR-labels); o resto **preservado** em decision-brief (`[DEC-0023-*]`), CHANGELOG, memory `[[feedback_lookup_not_coordination]]` e `.core/process/`. `NEXT.md` reduzido a casca documentada com tabela de disposição (migrado-onde / preservado-onde); **deleção física fica para o commit de encerramento**.
- [x] **R4** — Public-facing check (README + imagens editoriais): decidir conscientemente se precisam de atualização. **Binário** — marque `[x]` em **um** dos casos: (a) **não precisa** (registrar "não se aplica" + 1 linha de porquê); ou (b) **precisa → feito** (gerar/atualizar via wizard 🎨 `Gerar prompt visual` + `docs/editorial/`, e atualizar README/imagens antes do #27). **Não exige trabalho de imagem — exige a decisão** (gate de "não esquecer"). A execução de fato é registrada no `release-log.md` T2. Evidência: a linha marcada + link do que mudou (se aplicável). _(novo)_ **Decisão 2026-05-25 — (b) precisa → feito:** revisão baseada em evidência fechou três lacunas: (1) **README** — seção "Workflow Runtime (preview)" + tabela de comandos passaram a refletir o wizard de 8 opções, as ops transacionais (🔗 Integration PR, 🔀 merge-stack), `review` e `release-prep`, em linguagem consumer-facing; (2) **CHANGELOG** `[Unreleased]` ganhou os bullets do modelo de 3 boundaries e do gate determinístico de readiness (estavam ausentes); (3) **prompt** `docs/editorial/readme-dx-flow.prompt.md` corrigido de "6 opções"→"8 opções". **Imagens:** `ai-guidelines-dx-flow.png` **não exige regeneração** — renderiza só as 3-4 primeiras opções (inalteradas), então o conteúdo visível continua verídico; prompt corrigido cobre regenerações futuras. **Finding fora de escopo (não bloqueia R4):** os pointers de fase-review nos `tasks-*-boilerplate.md` (3 roots: `.core/partials`, `.specify/`, `.ai-guidelines/`) ainda citam numeração antiga ("R1–R6 liberam… R7 merge auth"); correção pertence à candidata de consolidação de roots de template / boilerplate-system-modernization (handoff: não mexer em cutover de roots nesta fase).
- [x] **R5** — Critérios de aceite + spec pronta para Done: critérios de aceite do `spec.md` confirmados ponto-a-ponto; Blocos A–L do `decision-brief.md` `Resolved` (F05 `Deferred` com critério) e refletidos em `plan.md`; `tasks.md` (execution) 100% `[x]`; wording de fechamento do `spec.md` pronto para virar `Done` após merge. **R5 não exige executar o fechamento** — exige que o texto/paths estejam prontos e revisados; a execução (status `Done`, etc.) acontece no encerramento (commit pós-merge). Evidência: links/trechos. _(ex-3.3/3.4 + wording de 4.4)_ **Confirmado 2026-05-25:** 11 critérios do `spec.md` ticados ponto-a-ponto; A–L `Resolved` na tabela do decision-brief; `tasks.md` 100% `[x]`; `spec.md` em `In Review (Stage D)` pronto para `Done` no encerramento.
- [x] **R6** — PR bodies coerentes ponta-a-ponta: descrições finais coerentes (especialmente #25); drift "PR6" não existe; Bloco L refletido. Descrevem o estado **já convergido** (R3–R5). Evidência: 1 linha por PR. _(ex-3.6)_ **Feito 2026-05-26 (1 linha por PR):** só o PR terminal precisava — os anteriores são registro histórico da própria entrega (não reescritos; ver R6 refinado no `review-boilerplate.md`):
  - **#18** (Bootstrap/PR1) — coerente, sem ação (registra o bootstrap pre-model; naming de planejamento é trilha).
  - **#19** (PR2-lifecycle) — coerente, sem ação.
  - **#22** (followup `.governance`) — coerente, sem ação.
  - **#23** (PR3-runtime-state-index) — coerente, sem ação.
  - **#24** (PR4-enforcement-runtime) — coerente, sem ação.
  - **#25** — **atualizado via `gh pr edit`**: 4 imagens + seção "Operação do ciclo"; Blocos **M** (3-boundary) e **N** (`review`) no Resumo, em "Entregue neste PR" e nas DECs (`M01`/`N01`); `release-prep` → `1.1.0`/`latest`; item "Migração NEXT→backlog" marcado feito (R3). (Deixou de ser terminal: o **#26** bootstrap alignment é o novo terminal de execução.)
  - **#26** (terminal de execução — este PR, bootstrap alignment) — body criado já coerente (`[DEC-0023-O01]`).
- [x] **R7** — Stack reviewed/ready + aprovação humana: PRs #18, #19, #22, #23, #24, #25, #26 em **Ready for review (GitHub)** + **aprovação humana explícita** — ≥1 review aprovado **ou** comentário textual do owner aprovando (exceção owner-only aceita e registrada). **Sign-off holístico, após R1–R6.** Evidência: link + status por PR. _(ex-3.7/3.8)_ **Fechado 2026-05-27:** stack #18–#26 em Ready for review (GitHub); owner aprovou textualmente ("aprovo" — exceção owner-only registrada). Cobre as adições da sessão de fechamento (soft-delete `archive()` + `[DEC-0023-O02]`/SkipGuard + reconciliação de catálogo/docs). **Pré-condição operacional:** os 2 últimos commits de doc (`97bb8a6`, `27a269a`) ainda precisam subir ao PR antes da abertura do #27. R1–R7 `[x]` → **#27 (Integration) liberado** para abertura via wizard 🔗.

## Merge authorization (ato humano — gate do merge-stack)

- [ ] **R8** — Merge authorization explícita (owner): autorização textual explícita registrada ("autorizo merge atômico" + data). Centraliza o gate humano que vivia em `1.H.[REVIEW]`/`4.9` do `tasks.md`. _(ex-1.H.[REVIEW]/4.9)_

- [x] **R9** — Branch em estado final: spec.md `Done`, state.yml `done`, NEXT.md deletado, historico.md atualizado, backlog.md limpo, release-log T0 preenchido. O merge não acontece com trabalho pendente na branch. **Fechado 2026-05-27:** todos os itens do checklist de fechamento do `WORKFLOW.md` Estágio 5 concluídos nesta branch antes do merge.

---

## Resultado

- **R1–R7 `[x]`** → Integration PR (#27) pode ser aberto.
- **R1–R8 `[x]`** → stack pode ser mergeada (merge-stack libera).
- **R9 `[x]`** → branch em estado final; merge encerra o ciclo sem pendências.
