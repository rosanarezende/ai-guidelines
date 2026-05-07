# Tasks — Spec 0019 Bootstrap Consumidor e Runtime — `mixed`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Review

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** **Bootstrap**: ler `roadmap/backlog.md` e `.core/process/spec-foundation.md`.
- [x] **0.2** **Tipo de spec** confirmado como `mixed` no header da `spec.md`.
- [x] **0.3** **Slug semântico** definido (`0019-bootstrap-consumidor-e-runtime`).
- [x] **0.4** Branch `feat/spec-0019-bootstrap-consumidor-e-runtime` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado.
- [x] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo.
- [x] **0.7** `plan.md` instanciado com os blocos A `(deterministic)` e B `(evidence-driven)`.
- [x] **0.8** `tasks.md` instanciado.
- [x] **0.9** `decision-brief.md` instanciado.
- [x] **0.10** `roadmap/backlog.md` atualizado: spec movida para "Em execução".
- [x] **0.11** `NEXT.md` instanciado (mandatório).
- [x] **0.12** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.

### Sub-bloco [0.Research] — Stage 1: produzir researches

- [x] **0.R.1** Listar perguntas de research a responder em `plan.md`.
- [x] **0.R.2** Produzir `research/YYYY-MM-DD-<tema>.md` por pergunta.
- [x] **0.R.3** Validar critério: cada research cobre perguntas do `plan.md`.
- [x] **0.R.4** Análise de débitos: registrar em `NEXT.md` insights que fujam do escopo.
- [x] **0.R.[COMMIT]** texto de commit incremental sugerido: "research(spec-0019): sínteses Stage 1 publicadas"

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

- [x] **0.B.1** Para cada `[DEC-0019-*]`: registrar Pergunta + Contexto + Opções.
- [x] **0.B.2** Cross-refs entre pontos.
- [x] **0.B.3** Tabela "Resumo de status" no fim do brief.
- [x] **0.B.4** Análise de débitos: registrar em `NEXT.md` opções descartadas que viram débitos.
- [x] **0.B.[COMMIT]** texto de commit incremental sugerido: "docs(spec-0019): decision-brief.md populado com opções Stage 1"

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

- [x] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-0019-*]`.
- [x] **0.G.2** Para cada ponto: owner escolhe opção e justifica; status muda para `Resolved`.
- [x] **0.G.3** Iterar se necessário.
- [x] **0.G.4** Status agregado mudado para `Resolved`.
- [x] **0.G.5** `plan.md` v2 publicado (seções de design técnico `(evidence-driven)` derivadas das decisões).
- [x] **0.G.6** `tasks.md` v2: atualizar Fases 1–4.
- [x] **0.G.7** Análise de débitos para o `NEXT.md`.
- [x] **0.G.[COMMIT]** texto de commit atômico sugerido: "docs(spec-0019): gate humano fechado — plan v2 + tasks v2 publicados"

---

## Fase 1 — Implementação A (Stage 2)

### Sub-bloco [A] — CLI Wizard & Template Distribution `(deterministic)`

- [x] **1.A.1** Atualizar scripts de init e adopt para copiar a pasta `.specify/templates` para `.ai-guidelines/templates` no consumidor.
- [x] **1.A.2** Refatorar wizard para apresentar prompts de features em categorias (Editoriais, Processo, etc).
- [x] **1.A.2.2** Substituir perguntas CSV do wizard por `checkbox`/`select` via `@inquirer/prompts`.
- [x] **1.A.2.3** Formalizar execução local da CLI via `yarn cli*` e atualizar o comando canônico na documentação/templates para compatibilidade com Yarn PnP.
- [x] **1.A.2.4** Redistribuir conteúdo útil do `CLAUDE.md` para documentos canônicos (`AGENTS.md` fora de `<AI_GUIDELINES>`, `README.md`, `CONTRIBUTING.md`) e reduzir o arquivo a ponteiro mínimo.
- [x] **1.A.2.5** Informar incompatibilidades de features selecionadas/default no modo interativo e oferecer override granular quando aplicável.
- [x] **1.B.1.2** Corrigir `providers` para preservar `features/lang` do runtime existente e fazer merge aditivo de providers por padrão.
- [x] **1.A.2.1** Persistir `.ai-guidelines/config.json` com `sdd_dir`, `providers`, `features` e `lang`, derivando `adapters` apenas em runtime.
- [x] **1.A.3** Remover arquivo legado `.core/templates/AGENTS-pointer.md.tmpl` e referências na compilação.
- [x] **1.A.N** Pipeline de check + test verde.
- [x] **1.A.4** Análise de débitos para o `NEXT.md`.
- [x] **1.A.[COMMIT]** texto de commit incremental sugerido: "feat(spec-0019): CLI Wizard & Template Distribution"
- [x] **1.A.[COMMIT-UX]** texto de commit incremental sugerido: "feat(spec-0019): melhora UX do wizard com inquirer"

### Sub-bloco [B] — Runtime Architecture & Trampolines `(evidence-driven)`

- [x] **1.B.1** Implementar scaffolding de trampolins e ignore files por provider selecionado.
- [x] **1.B.1.1** Criar comando `providers` para adicionar/atualizar trampolins sem rerodar `adopt`.
- [x] **1.B.2** Atualizar `compiler.mjs` para zones temáticas e interpolação via `sdd_dir`.
- [x] **1.B.N** Pipeline de check + test verde.
- [x] **1.B.3** Análise de débitos para o `NEXT.md`.
- [x] **1.B.[COMMIT]** texto de commit incremental sugerido: "feat(spec-0019): Runtime Architecture & Trampolines"

### Sub-bloco [C] — Update Lifecycle Unificado `(deterministic, adicionado em 2026-05-07)`

- [x] **1.C.1** Implementar módulo `cli/features/core/managed-block.mjs`: parser/serializer de blocos delimitados por `<!-- ai-guidelines:managed-start v=1 -->` ... `<!-- ai-guidelines:managed-end -->` (Markdown) e `# ai-guidelines:managed-start v=1` ... `# ai-guidelines:managed-end` (gitignore-style). Três estratégias de write: arquivo novo, arquivo gerenciado existente (substitui apenas bloco interno), arquivo legado sem marcadores (prepend bloco + comentário humano em PT-BR + conteúdo legado preservado abaixo).
- [x] **1.C.2** Cobrir `managed-block.mjs` com testes unitários: arquivo novo, arquivo gerenciado existente, arquivo legado sem marcadores, idempotência (rerodar não duplica), arquivo idêntico (no-op), versionamento `v=N` antigo (warning).
- [x] **1.C.3** Refatorar `cli/features/core/trampolines.mjs` para emitir conteúdo via `managed-block`. Adapter rules do provider correspondente (`.core/rules/adapters/<id>.md` quando aplicável) são injetadas dentro do bloco gerenciado, abaixo do hard-redirect. Mapping: `claude→claude`, `openai→codex`, `gemini→gemini`; demais providers (cursor, copilot, windsurf, aider) recebem só hard-redirect.
- [x] **1.C.4** Remover seção `### Provider Adapters` do `cli/governance/monolith/compiler.mjs` (e o H3 órfão). Atualizar testes do compiler e snapshots.
- [x] **1.C.5** `cli/features/core/templates.mjs` opera em modo `mirror` controlado: aceita flag `prune` apenas quando chamado por `init`/`adopt`/`update`, nunca por `providers`. Corrige bug de regressão silenciosa em `.ai-guidelines/templates/`.
- [x] **1.C.6** Adicionar comando `update` em `cli/app/engine.mjs` e registrar em `cli/cli/args.mjs` (parser + help). Comportamento: lê `.ai-guidelines/config.json`, re-aplica trampolins (managed-block) + templates (mirror) + recompilação do `AGENTS.md`. Headless por padrão; `--force` reescreve conteúdo legado também (raro).
- [x] **1.C.7** Validar `sdd_dir` em `cli/features/core/config.mjs` contra path traversal (não absoluto, sem `..`, contido em `targetDir`).
- [x] **1.C.8** Onda 1+2 de correções residuais do PR review:
  - [x] mensagens de erro em `engine.mjs` e `args.mjs` incluem `providers`/`update`;
  - [x] logs de `writeFileIfChanged`/`ensureDir` relativos a `process.cwd()` (não a `ROOT_DIR`);
  - [x] action de prettier prefixa `[dry-run]` quando aplicável.
- [x] **1.C.9** Onda 3 — polimentos: importar `SUPPORTED_PROVIDERS` em `trampolines.mjs`; simplificar fallback redundante em `pointers.mjs`; comentar heurística `GR-0203 → "git"`.
- [x] **1.C.10** Estender `tests/integration/cli.integration.test.mjs`: trampoline preexistente sem marcadores → bloco gerenciado prepended + comentário humano; trampoline com marcadores → apenas bloco interno atualizado; rerodar `update` é idempotente; `providers --prune` NÃO apaga templates SDD; `sdd_dir` malicioso é rejeitado.
- [x] **1.C.N** Pipeline de check + test verde.
- [x] **1.C.11** Análise de débitos para o `NEXT.md`.
- [x] **1.C.[COMMIT-DOCS]** texto sugerido: "docs(spec-0019): reabre escopo para update lifecycle e adapter migration"
- [x] **1.C.[COMMIT-MANAGED]** texto sugerido: "feat(spec-0019): introduz managed-block e comando update"
- [x] **1.C.[COMMIT-ADAPTER]** texto sugerido: "feat(spec-0019): migra adapter content para trampolins"
- [x] **1.C.[COMMIT-FIX]** texto sugerido: "fix(spec-0019): correções residuais do PR review"

---

## Fase 2 — Implementação B (Stage 2)

(Fundido na Fase 1, já que os sub-blocos A, B e C cobrem o escopo técnico, salvo descoberta de novos sub-blocos).

---

## Fase 3 — Preparação para Review (Gate de Homologação)

- [x] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [x] **3.2** Pipeline canônico verde (`yarn check:repo` ou similar).
- [x] **3.3** Critérios de aceite de `spec.md` e DoD de `plan.md` confirmados.
- [x] **3.4** `decision-brief.md`: validar pontos `Resolved` contra o design.
- [x] **3.5** Validar a entrega em ambiente real (`yarn cli adopt --target . --dry-run`).
- [x] **3.6** PR atualizado com descrição em 3 etapas.
- [x] **3.7** Gate de Review Humano executado — owner identificou itens críticos (regressão silenciosa em `--prune`, path traversal em `sdd_dir`, H3 órfão) e ampliou escopo para política de update unificada (sub-bloco C).
- [x] **3.8** Aplicar correções do sub-bloco C (Fase 1.C completa).
- [x] **3.9** Re-validar entrega em ambiente real após correções (`yarn guidelines adopt`, `yarn guidelines providers`, `yarn guidelines update`, todos em `--dry-run`). Comando renomeado de `yarn cli` para `yarn guidelines` durante a fase.
- [x] **3.10** Atualizar PR body refletindo escopo expandido e disclosure de IA atualizada.
- [ ] **3.11** **[MANDATÓRIO]** Aguardar segundo Gate de Review Humano (pós-correções).

---

## Fase 4 — Encerramento Pré-Merge

- [x] **4.1** `NEXT.md` deletado; insight 3 (notificação proativa de updates) migrado para o item oportunista "Check de Atualização interino no CLI" no `backlog.md`.
- [x] **4.2** Researches migrados: `research/2026-05-06-{topologia-runtime,trampolins-e-guardrails}.md` → `.specify/specs/researchs/architecture/`. Links em `decision-brief.md` e `plan.md` atualizados.
- [x] **4.3** `decision-brief.md` permanece no diretório da spec (com bloco C adicionado em 2026-05-07).
- [x] **4.4** `spec.md` header em `In Review`, com nota de reabertura consensuada (2026-05-07). Status final → `Done` será aplicado pós-merge.
- [x] **4.5** `roadmap/historico.md` atualizado com entrada da Spec 0019 (sub-blocos A/B/C, researches migrados, métricas de qualidade). `backlog.md` removeu a 0019 da seção "Em execução".
- [x] **4.6** `CHANGELOG.md` atualizado em `[Unreleased]` cobrindo a entrega completa (managed-block, comando `update`, `check-budget`, rename `yarn cli` → `yarn guidelines`, refator topológico do `AGENTS.md`, etc.).
- [x] **4.7** `yarn guidelines check-budget` confirmou todos os escopos dentro do limite (universal 74%, opt-in 33%, AGENTS.md 56%, entrypoints 28-30%; 0 warnings).
- [x] **4.8** Commit `chore(spec-0019): encerramento pré-merge` (este).
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge.
